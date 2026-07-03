import { useState, useEffect } from 'react';
import { Play, Search, Video, Sparkles, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

// Highly polished, curated fallback list of top-tier productivity YouTube videos in 3 languages
const CURATED_VIDEOS: Record<string, YouTubeVideo[]> = {
  en: [
    {
      id: 'iONA9S_V1E4',
      title: 'How to Manage Your Time (3 Essential Rules)',
      description: 'Ali Abdaal shares his ultimate rules to stop wasting time and achieve maximum output.',
      thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Thomas Frank & Ali Abdaal',
      channelTitle: 'Ali Abdaal'
    },
    {
      id: 'mNBmG24djoY',
      title: 'The Pomodoro Technique - How to Focus 100%',
      description: 'Learn the famous Pomodoro technique to divide your day into laser-focused blocks.',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Time Management Classics',
      channelTitle: 'Productivity Game'
    },
    {
      id: 'QXmKeas3o68',
      title: 'The 2-Minute Rule to End Procrastination',
      description: 'If it takes less than 2 minutes, do it now. A powerful concept from Getting Things Done.',
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-2ca0a72f3425?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Atomic Habits & GTD',
      channelTitle: 'James Clear Insights'
    },
    {
      id: 'U_p_GfM_mTo',
      title: 'How to Build Unstoppable Daily Habits',
      description: 'Master the science of atomic changes and trigger loops to stay perfectly consistent.',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Habit Mastery Series',
      channelTitle: 'Sprout Focus'
    }
  ],
  ar: [
    {
      id: 'iONA9S_V1E4',
      title: 'كيف تدير وقتك ببراعة (3 قواعد أساسية لليوم)',
      description: 'شارك علي عبد العال القوانين الأساسية للتوقف عن إضاعة الوقت وتحقيق أقصى قدر من الإنتاجية.',
      thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'إدارة الوقت والإنتاجية',
      channelTitle: 'علي عبد العال'
    },
    {
      id: 'mNBmG24djoY',
      title: 'تقنية البومودورو - كيف تركز بنسبة 100٪',
      description: 'تعرف على تقنية البومودورو الشهيرة لتقسيم يومك إلى فترات زمنية مركزة وخالية من المشتتات.',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'سلسلة التركيز الكامل',
      channelTitle: 'بروداكتيفيتي غيم'
    },
    {
      id: 'QXmKeas3o68',
      title: 'قاعدة الدقيقتين للقضاء على التسويف والمماطلة',
      description: 'إذا كان العمل يستغرق أقل من دقيقتين، فقم بإنجازه الآن. مفهوم مستوحى من نظام GTD.',
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-2ca0a72f3425?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'العادات الذرية والإنتاجية',
      channelTitle: 'جيمس كلير بالعربي'
    },
    {
      id: 'U_p_GfM_mTo',
      title: 'كيف تبني عادات يومية مستدامة وقوية',
      description: 'أتقن علم التغييرات الصغيرة والحلقات التحفيزية لتظل متسقاً ومنجزاً بشكل يومي.',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'أسرار النجاح اليومي',
      channelTitle: 'عقل منتج'
    }
  ],
  fr: [
    {
      id: 'iONA9S_V1E4',
      title: 'Comment Gérer Votre Temps (3 Règles d\'Or)',
      description: 'Ali Abdaal partage ses règles ultimes pour arrêter de perdre son temps et booster ses résultats.',
      thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Gestion du Temps',
      channelTitle: 'Ali Abdaal'
    },
    {
      id: 'mNBmG24djoY',
      title: 'La Technique Pomodoro - Concentration Maximale',
      description: 'Apprenez la célèbre méthode Pomodoro pour diviser vos séances de travail en blocs ultra-efficaces.',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Méthodes de Focus',
      channelTitle: 'Productivity Game'
    },
    {
      id: 'QXmKeas3o68',
      title: 'La Règle des 2 Minutes contre la Procrastination',
      description: 'Si cela prend moins de 2 minutes, faites-le immédiatement. Extrêmement efficace.',
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-2ca0a72f3425?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Atomic Habits & Focus',
      channelTitle: 'James Clear FR'
    },
    {
      id: 'U_p_GfM_mTo',
      title: 'Comment Créer des Habitudes Quotidiennes Solides',
      description: 'Maîtrisez la science des petits changements atomiques pour rester régulier chaque jour.',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60',
      publishedAt: 'Maîtrise des Habitudes',
      channelTitle: 'Sprout Focus'
    }
  ]
};

export default function ProductivityTips() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isRtl = currentLang === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>(() => CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const apiKey = ''; // Temporarily disabled by user request to run purely on curated premium recommendations without an API key

  // Whenever user language changes, reset search & switch curated fallback to appropriate translated videos
  useEffect(() => {
    if (!isLive) {
      setVideos(CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
    }
  }, [currentLang, isLive]);

  async function fetchYouTubeVideos(queryText: string) {
    if (!apiKey) {
      // No API Key, log and show beautiful offline recommendations
      console.log('YouTube API Key missing. Falling back to curated peak recommendations.');
      setIsLive(false);
      setVideos(CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
      return;
    }

    setLoading(true);
    try {
      const refinedQuery = `${queryText} productivity time management tips`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(refinedQuery)}&type=video&videoDuration=short&maxResults=4&key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('YouTube API request failed or limit exceeded.');
      }
      
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const parsedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : currentLang === 'fr' ? 'fr-FR' : 'en-US'),
          channelTitle: item.snippet.channelTitle
        }));
        setVideos(parsedVideos);
        setIsLive(true);
        setShowNotification(false);
      } else {
        // Fallback if no search results
        setVideos(CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
        setIsLive(false);
      }
    } catch (err) {
      console.error('Error fetching YouTube API:', err);
      // Fallback and notify the user elegantly
      setVideos(CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
      setIsLive(false);
      setShowNotification(true);
      // Auto close notification after 5 seconds
      setTimeout(() => setShowNotification(false), 6000);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      // reset to curated fallback if empty search
      setIsLive(false);
      setVideos(CURATED_VIDEOS[currentLang] || CURATED_VIDEOS.en);
      return;
    }
    fetchYouTubeVideos(query);
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs mb-6 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-amber-50/40 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1 bg-amber-50 text-amber-600 rounded-lg">🎥</span>
            {t('productivity_tips_title')}
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
              isLive 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              {isLive ? t('live_badge') : t('curated_badge')}
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {t('productivity_tips_desc')}
          </p>
        </div>

        {/* Live Search Inputs (YouTube Integration) - Only shown if API Key is configured */}
        {apiKey ? (
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-72">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              id="tips-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_tips_placeholder')}
              className={`w-full ${isRtl ? 'pr-9 pl-12' : 'pl-9 pr-12'} py-2 bg-slate-50 border-0 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/10 focus:bg-white transition-all`}
            />
            <button
              type="submit"
              id="search-tips-submit-btn"
              disabled={loading}
              className={`absolute ${isRtl ? 'left-1' : 'right-1'} top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-1.5 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center`}
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-500">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Premium Hand-Picked Tips</span>
          </div>
        )}
      </div>

      {/* Elegant Warning/Notice Banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 mb-4 text-xs font-semibold text-amber-800 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{t('video_error')}</p>
            </div>
            <button 
              type="button"
              id="close-tips-error"
              onClick={() => setShowNotification(false)} 
              className="text-amber-400 hover:text-amber-600 font-bold cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map((vid) => (
          <motion.div
            key={vid.id}
            whileHover={{ y: -4 }}
            className="group relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex flex-col justify-between"
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video bg-slate-200 overflow-hidden shrink-0">
              <img 
                src={vid.thumbnail} 
                alt={vid.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  id={`play-vid-${vid.id}`}
                  onClick={() => setActiveVideoId(vid.id)}
                  className="w-10 h-10 bg-white/90 hover:bg-white text-rose-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>
              <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                {t('duration_short')}
              </span>
            </div>

            {/* Video metadata */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                  {vid.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold line-clamp-2">
                  {vid.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100/50 mt-2 flex items-center justify-between text-[9px] text-slate-400 font-extrabold">
                <span className="truncate max-w-[80px]">{vid.channelTitle}</span>
                <span>{vid.publishedAt || 'YouTube'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Playback Modal Overlay */}
      <AnimatePresence>
        {activeVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl relative"
            >
              {/* Embed Iframe Container */}
              <div className="aspect-video w-full bg-black">
                <iframe
                  id="tips-yt-iframe"
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Footer controls inside modal */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>YouTube Premium Productivity Tip</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {t('watch_on_youtube')} <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    id="close-tips-modal-btn"
                    onClick={() => setActiveVideoId(null)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('cancel_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
