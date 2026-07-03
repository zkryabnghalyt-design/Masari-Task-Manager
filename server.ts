import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client as instructed
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper to execute API requests with exponential backoff on transient errors (e.g., 503 High Demand)
  async function generateWithRetry(fn: () => Promise<any>, retries = 2, delay = 800) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const isTransient = err?.status === 503 || err?.code === 503 || err?.message?.includes("503") || err?.message?.includes("high demand") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("unavailable");
        if (isTransient && i < retries) {
          console.warn(`Gemini API 503 High Demand detected. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          throw err;
        }
      }
    }
  }

  // Local rule-based fallback generator when the upstream API is unavailable
  function generateLocalSchedule(tasks: any[], energyLevel: number, locale: string) {
    const currentLang = locale || 'en';
    
    const localized = {
      en: {
        analysis: `⚡ [High Demand Adaptive Mode] Due to extremely high global AI demand, we have temporarily activated your localized cognitive engine. Based on your current energy (${energyLevel}/10), we have mapped your active high-priority objectives into peak performance blocks balanced with strategic recovery periods.`,
        tips: [
          "Tackle your most cognitively taxing task first to build momentum.",
          "Maintain optimal hydration and take a 5-minute movement break between focus blocks.",
          "Keep workspace distractions minimal to sustain deep flow state."
        ],
        breakTitle1: "Strategic Recharge Break",
        breakReason1: "Essential 15-minute screen-free window to restore mental alertness.",
        breakTitle2: "Mindful Recovery Break",
        breakReason2: "A quick physical reset or stretch to beat the post-lunch energy slump.",
        slots: [
          { time: "09:00 - 10:30", label: "Morning High-Focus Block", reason: "Scheduled during your natural cognitive peak to maximize efficiency." },
          { time: "11:00 - 12:30", label: "Core Implementation Phase", reason: "Ideal slot for sustained focus and steady execution of key goals." },
          { time: "13:30 - 14:30", label: "Light Focus / Collaboration", reason: "Best suited for administrative tasks or moderate effort items." },
          { time: "15:30 - 17:00", label: "Closing Momentum Block", reason: "Wrap up outstanding actions and organize files for tomorrow." }
        ]
      },
      ar: {
        analysis: `⚡ [وضع التكيف عالي الطلب] نظراً لارتفاع الطلب العالمي على خدمة الذكاء الاصطناعي، قمنا بتنشيط محرك الجدولة المعرفي المحلي مؤقتاً. بناءً على مستوى طاقتك الحالي (${energyLevel}/10)، قمنا بتوزيع مهامك النشطة ذات الأولوية العالية في فترات ذروة الأداء متوازنة مع فترات تعافي استراتيجية.`,
        tips: [
          "ابدأ بالمهام الأكثر تطلباً ذهنياً لبناء زخم قوي ليومك.",
          "حافظ على ترطيب جسمك وخذ فترة حركة قصيرة بين فترات التركيز.",
          "قلل من المشتتات في بيئة العمل للحفاظ على حالة التدفق والتركيز."
        ],
        breakTitle1: "استراحة شحن طاقة استراتيجية",
        breakReason1: "فترة خالية من الشاشات لمدة 15 دقيقة لاستعادة اليقظة الذهنية.",
        breakTitle2: "استراحة تعافي وذهن صافٍ",
        breakReason2: "تمدد سريع أو تمرين تنفس للتغلب على خمول ما بعد الغداء.",
        slots: [
          { time: "09:00 - 10:30", label: "فترة التركيز الصباحي العالي", reason: "مجدولة خلال ذروتك الإدراكية الطبيعية لزيادة الكفاءة." },
          { time: "11:00 - 12:30", label: "مرحلة التنفيذ الأساسية", reason: "فترة مثالية للتركيز المستمر والتنفيذ المستقر للأهداف الرئيسية." },
          { time: "13:30 - 14:30", label: "تركيز خفيف / مهام تعاونية", reason: "أنسب للمهام الإدارية أو البسيطة التي تتطلب جهداً متوسطاً." },
          { time: "15:30 - 17:00", label: "فترة الزخم الختامي", reason: "إنهاء الأعمال المتبقية وتنظيم الملفات استعداداً للغد." }
        ]
      },
      fr: {
        analysis: `⚡ [Planification de Secours] En raison d'une forte demande sur l'IA, votre moteur de planification cognitif local a été activé. Selon votre niveau d'énergie actuel (${energyLevel}/10), nous avons réparti vos objectifs prioritaires sur vos pics de productivité naturelle.`,
        tips: [
          "Attaquez la tâche la plus exigeante en premier pour créer un élan positif.",
          "Restez hydraté et faites une pause de mouvement de 5 minutes entre les sessions.",
          "Éliminez les notifications pour maintenir un état de concentration profonde."
        ],
        breakTitle1: "Pause de Recharge Stratégique",
        breakReason1: "Un moment de 15 minutes sans écran pour restaurer la vigilance mentale.",
        breakTitle2: "Pause de Récupération Consciente",
        breakReason2: "Un étirement rapide ou exercice de respiration pour surmonter le coup de barre de l'après-midi.",
        slots: [
          { time: "09:00 - 10:30", label: "Bloc de Haute Concentration", reason: "Planifié pendant votre pic cognitif naturel pour maximiser l'efficacité de votre énergie." },
          { time: "11:00 - 12:30", label: "Phase d'Exécution Principale", reason: "Créneau idéal pour un focus soutenu et une progression stable de vos objectifs." },
          { time: "13:30 - 14:30", label: "Tâches Légères / Administratives", reason: "Parfaitement adapté aux tâches de faible effort ou à la gestion de mails." },
          { time: "15:30 - 17:00", label: "Bloc de Clôture", reason: "Finalisez vos actions en cours et organisez vos dossiers pour demain." }
        ]
      }
    };

    const currentLocalization = localized[currentLang as keyof typeof localized] || localized.en;
    const activeTasks = tasks.filter(t => !t.completed);
    
    // Sort tasks by priority and effort matching
    const sortedTasks = [...activeTasks].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aWeight = priorityWeight[a.priority as keyof typeof priorityWeight] || 1;
      const bWeight = priorityWeight[b.priority as keyof typeof priorityWeight] || 1;
      
      if (aWeight !== bWeight) {
        return bWeight - aWeight;
      }
      
      const aDiff = Math.abs((a.effort || 5) - energyLevel);
      const bDiff = Math.abs((b.effort || 5) - energyLevel);
      return aDiff - bDiff;
    });

    const schedule: any[] = [];
    let taskIdx = 0;

    // Slot 1
    const s1 = currentLocalization.slots[0];
    if (taskIdx < sortedTasks.length) {
      const task = sortedTasks[taskIdx++];
      schedule.push({
        timeSlot: s1.time,
        taskId: task.id,
        title: task.title,
        reason: `${s1.reason} Matched to priority ${task.priority.toUpperCase()} and effort ⚡ ${task.effort || 5}.`,
        priority: task.priority
      });
    } else {
      schedule.push({
        timeSlot: s1.time,
        taskId: null,
        title: s1.label,
        reason: s1.reason,
        priority: "medium"
      });
    }

    // Break 1
    schedule.push({
      timeSlot: "10:30 - 10:45",
      taskId: null,
      title: currentLocalization.breakTitle1,
      reason: currentLocalization.breakReason1,
      priority: "break"
    });

    // Slot 2
    const s2 = currentLocalization.slots[1];
    if (taskIdx < sortedTasks.length) {
      const task = sortedTasks[taskIdx++];
      schedule.push({
        timeSlot: s2.time,
        taskId: task.id,
        title: task.title,
        reason: `${s2.reason} Matched to priority ${task.priority.toUpperCase()} and effort ⚡ ${task.effort || 5}.`,
        priority: task.priority
      });
    } else {
      schedule.push({
        timeSlot: s2.time,
        taskId: null,
        title: s2.label,
        reason: s2.reason,
        priority: "medium"
      });
    }

    // Slot 3
    const s3 = currentLocalization.slots[2];
    if (taskIdx < sortedTasks.length) {
      const task = sortedTasks[taskIdx++];
      schedule.push({
        timeSlot: s3.time,
        taskId: task.id,
        title: task.title,
        reason: `${s3.reason} Matched to priority ${task.priority.toUpperCase()} and effort ⚡ ${task.effort || 5}.`,
        priority: task.priority
      });
    } else {
      schedule.push({
        timeSlot: s3.time,
        taskId: null,
        title: s3.label,
        reason: s3.reason,
        priority: "low"
      });
    }

    // Break 2
    schedule.push({
      timeSlot: "15:00 - 15:15",
      taskId: null,
      title: currentLocalization.breakTitle2,
      reason: currentLocalization.breakReason2,
      priority: "break"
    });

    // Slot 4
    const s4 = currentLocalization.slots[3];
    if (taskIdx < sortedTasks.length) {
      const task = sortedTasks[taskIdx++];
      schedule.push({
        timeSlot: s4.time,
        taskId: task.id,
        title: task.title,
        reason: `${s4.reason} Matched to priority ${task.priority.toUpperCase()} and effort ⚡ ${task.effort || 5}.`,
        priority: task.priority
      });
    } else {
      schedule.push({
        timeSlot: s4.time,
        taskId: null,
        title: s4.label,
        reason: s4.reason,
        priority: "low"
      });
    }

    return {
      analysis: currentLocalization.analysis,
      schedule,
      tips: currentLocalization.tips
    };
  }

  // API route to suggest prioritized daily schedule based on tasks, deadlines, and energy levels
  app.post("/api/schedule", async (req, res) => {
    const { tasks, energyLevel, locale } = req.body;

    try {
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: "Tasks must be an array" });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("Gemini API key is not configured. Falling back to local precision scheduler.");
        return res.json(generateLocalSchedule(tasks, energyLevel, locale));
      }

      const prompt = `
You are an elite productivity coach and cognitive performance scientist.
Your job is to analyze the user's tasks, their deadlines, priorities, categories, effort values, and their current energy level (${energyLevel}/10).
Then, design a highly optimized, realistic, and motivating daily schedule.

User current energy level: ${energyLevel}/10 (1 is completely exhausted, 10 is fully supercharged and mentally sharp).

Active tasks list:
${JSON.stringify(tasks, null, 2)}

Please output your response strictly matching the requested JSON schema.
Ensure the text is fully customized and written in the requested language/locale: "${locale || 'en'}".
- The "analysis" field should explain how you prioritized their day. For example, if energy is low, recommend simpler tasks, but if energy is high, push them to tackle demanding high-effort, high-priority work. Highlight critical upcoming deadlines.
- The "schedule" array must have realistic blocks of time (timeSlot, e.g. "08:30 - 10:00" or "Midday Focus").
- Map relevant tasks by placing their string 'id' in 'taskId' if they fit. If a block is a break, recharge time, or admin, use null for 'taskId'.
- Include 1 or 2 breaks/recharge slots to keep performance high and prevent burnout.
- The "tips" must be 2-3 short, powerful, actionable tips tailored to their specific state.
`;

      const callModel = async () => {
        return await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                analysis: {
                  type: Type.STRING,
                  description: "Motivational and strategic task analysis based on energy level and deadlines, in the user's selected language."
                },
                schedule: {
                  type: Type.ARRAY,
                  description: "Optimized chronological sequence of blocks for the day.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeSlot: {
                        type: Type.STRING,
                        description: "E.g. '09:00 - 10:30', '14:00 - 14:30', or 'Evening wind-down'"
                      },
                      taskId: {
                        type: Type.STRING,
                        description: "The id of the mapped task, or null if it's a general block/break."
                      },
                      title: {
                        type: Type.STRING,
                        description: "Descriptive title for the block."
                      },
                      reason: {
                        type: Type.STRING,
                        description: "Explanation of why this task is scheduled at this time based on energy match, priority, or deadline, in the user's language."
                      },
                      priority: {
                        type: Type.STRING,
                        description: "Must be 'high', 'medium', 'low', or 'break'."
                      }
                    },
                    required: ["timeSlot", "title", "reason", "priority"]
                  }
                },
                tips: {
                  type: Type.ARRAY,
                  description: "2-3 custom tips for focus and execution.",
                  items: {
                    type: Type.STRING
                  }
                }
              },
              required: ["analysis", "schedule", "tips"]
            }
          }
        });
      };

      const response = await generateWithRetry(callModel, 2, 800);
      const responseText = response.text || "{}";
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Gemini AI schedule error (falling back to local engine):", error);
      // Fallback cleanly to beautiful structured fallback schedule so the user never encounters a raw error!
      res.json(generateLocalSchedule(tasks, energyLevel, locale));
    }
  });

  // Local motivation fallback when Gemini API is unavailable
  function generateLocalMotivation(completedCount: number, activeCount: number, level: number, points: number, locale: string) {
    const localized = {
      en: {
        motivation: `🌟 **You are doing absolutely fantastic!** You are currently at **Level ${level}** with **${points} points** ready to spend! You have completed **${completedCount} tasks** and have **${activeCount} active tasks** waiting for you. Keep up this magnificent energy and crush your goals today! 🚀`
      },
      ar: {
        motivation: `🌟 **أنت تقوم بعمل رائع حقاً!** أنت الآن في **المستوى ${level}** ولديك **${points} نقطة** جاهزة للاستخدام في المتجر! لقد أكملت **${completedCount} من المهام** ولديك **${activeCount} مهمة نشطة** بانتظارك. حافظ على هذه الطاقة الرائعة وحقق أهدافك اليوم! 🚀`
      },
      fr: {
        motivation: `🌟 **Vous faites un travail absolument fantastique !** Vous êtes actuellement au **Niveau ${level}** avec **${points} points** prêts à être dépensés ! Vous avez terminé **${completedCount} tâches** et vous avez **${activeCount} tâches actives** qui vous attendent. Gardez cette magnifique énergie et atteignez vos objectifs aujourd'hui ! 🚀`
      }
    };
    const currentLang = locale || 'en';
    return localized[currentLang as keyof typeof localized] || localized.en;
  }

  // API route to generate interactive cheerleader quotes from Gemini
  app.post("/api/motivation", async (req, res) => {
    const { completedCount, activeCount, level, points, locale } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json(generateLocalMotivation(completedCount, activeCount, level, points, locale));
      }

      const prompt = `
You are a high-energy, enthusiastic productivity cheerleader and personal motivation coach.
The user has the following stats:
- Current level: ${level}
- Total Points/XP: ${points}
- Completed Tasks: ${completedCount}
- Pending/Active Tasks: ${activeCount}

Provide a highly personalized, energetic, and extremely encouraging motivational cheerleading summary of their day or current status.
Write the response in the user's requested language/locale: "${locale || 'en'}".
Be enthusiastic, friendly, and use lots of supportive words and 2-3 motivating emojis. Keep it to 2-3 sentences.
Output your response in a simple JSON structure with a "motivation" string field.
`;

      const callModel = async () => {
        return await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                motivation: {
                  type: Type.STRING,
                  description: "Enthusiastic and personalized cheerleader quote in the user's language."
                }
              },
              required: ["motivation"]
            }
          }
        });
      };

      const response = await generateWithRetry(callModel, 2, 800);
      const responseText = response.text || "{}";
      res.json(JSON.parse(responseText.trim()));
    } catch (error) {
      console.error("Gemini AI motivation error:", error);
      res.json(generateLocalMotivation(completedCount, activeCount, level, points, locale));
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
