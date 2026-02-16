import website_name from "@/src/config/website.js";
import Spotlight from "@/src/components/spotlight/Spotlight.jsx";
import Trending from "@/src/components/trending/Trending.jsx";
import CategoryCard from "@/src/components/categorycard/CategoryCard.jsx";
import Genre from "@/src/components/genres/Genre.jsx";
import Topten from "@/src/components/topten/Topten.jsx";
import Loader from "@/src/components/Loader/Loader.jsx";
import Error from "@/src/components/error/Error.jsx";
import { useHomeInfo } from "@/src/context/HomeInfoContext.jsx";
import Schedule from "@/src/components/schedule/Schedule";
import ContinueWatching from "@/src/components/continue/ContinueWatching";
import TabbedAnimeSection from "@/src/components/tabbed-anime/TabbedAnimeSection";
import LoveSiteBanner from "@/src/components/banner/LoveSiteBanner.jsx";
import RecentComments from "@/src/components/recentcomments/RecentComments.jsx";
import TopUpcoming from "@/src/components/topupcoming/TopUpcoming.jsx";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function Home() {
  const { language } = useLanguage();
  const { homeInfo, homeInfoLoading, error } = useHomeInfo();
  if (homeInfoLoading) return <Loader type="home" />;
  if (error) return <Error />;
  if (!homeInfo) return <Error error="404" />;
  return (
    <>
      <div className="pt-[60px] w-full max-md:pt-[56px]">
        <Spotlight spotlights={homeInfo.spotlights} />
        <div className="mt-3 max-md:mt-2">
          <Genre data={homeInfo.genres} />
        </div>
        <ContinueWatching />
        
        <div className="w-full grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col mt-8 max-[1200px]:mt-6">
          <div>
            {/* Love Site Banner - Desktop on same line as Top 10 */}
            <div className="max-[1200px]:hidden">
              <LoveSiteBanner />
            </div>
            
            {/* Love Site Banner - Mobile at top of Latest Episode */}
            <div className="min-[1201px]:hidden mb-2">
              <LoveSiteBanner />
            </div>

            <RecentComments />
            
            <CategoryCard
              label={getTranslation(language, 'latestEpisodes')}
              data={homeInfo.latest_episode}
              className="mt-6 max-[1200px]:mt-4"
              path="recently-updated"
              limit={12}
            />
            <CategoryCard
              label={getTranslation(language, 'newOnJustAnime')}
              data={homeInfo.recently_added}
              className="mt-8"
              path="recently-added"
              limit={12}
            />
            <Schedule className="mt-8" />
            <TabbedAnimeSection 
              topAiring={homeInfo.top_airing}
              mostFavorite={homeInfo.most_favorite}
              latestCompleted={homeInfo.latest_completed}
              className="mt-5 max-md:mt-4"
            />
          </div>
          <div className="w-full max-[1200px]:mt-5">
            <Topten data={homeInfo.topten} />
            <Trending trending={homeInfo.trending} className="mt-12 max-md:mt-6" />
            <TopUpcoming topUpcoming={homeInfo.top_upcoming} className="mt-12 max-md:mt-6" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
