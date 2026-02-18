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
import { Helmet } from 'react-helmet-async';
import {
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
  generateItemListSchema
} from "@/src/utils/seo.utils";

function Home() {
  const { homeInfo, homeInfoLoading, error } = useHomeInfo();
  if (homeInfoLoading) return <Loader type="home" />;
  if (error) return <Error />;
  if (!homeInfo) return <Error error="404" />;

  const websiteSchema = generateWebsiteStructuredData();
  const organizationSchema = generateOrganizationStructuredData();
  const trendingSchema = homeInfo.trending ? generateItemListSchema(homeInfo.trending, "Trending Anime") : null;

  return (
    <>
      <Helmet>
        <title>{website_name} | Free Anime Streaming Platform</title>
        <meta name="description" content={`${website_name} is the best site to watch anime online for free. Stream thousands of English subbed and dubbed anime episodes in HD quality with no ads.`} />
        <meta name="keywords" content="justanime, watch anime free, anime online sub dub, free anime streaming, no ads anime, best anime site" />
        <link rel="canonical" href="https://justanime.fun" />

        <meta property="og:title" content={`${website_name} | Free Anime Streaming Platform`} />
        <meta property="og:description" content={`Watch high-quality anime online for free on ${website_name}. No ads, daily updates, and a massive library of subbed and dubbed content.`} />
        <meta property="og:url" content="https://justanime.fun" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${website_name} | Free Anime Streaming Platform`} />
        <meta name="twitter:description" content={`Stream thousands of anime episodes for free in HD quality on ${website_name}. The best ad-free experience for anime fans!`} />

        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        {trendingSchema && (
          <script type="application/ld+json">
            {JSON.stringify(trendingSchema)}
          </script>
        )}
      </Helmet>
      <div className="pt-16 w-full">
        <Spotlight spotlights={homeInfo.spotlights} />
        <div className="mt-6">
          <Genre data={homeInfo.genres} />
        </div>
        <ContinueWatching />

        <div className="w-full grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col">
          <div>
            <CategoryCard
              label="Latest Episode"
              data={homeInfo.latest_episode}
              className="mt-[60px]"
              path="recently-updated"
              limit={12}
            />
            <Schedule className="mt-8" />
            <TabbedAnimeSection
              topAiring={homeInfo.top_airing}
              mostFavorite={homeInfo.most_favorite}
              latestCompleted={homeInfo.latest_completed}
              className="mt-8"
            />
          </div>
          <div className="w-full mt-[60px]">
            <Trending trending={homeInfo.trending} />
            <Topten data={homeInfo.topten} className="mt-12" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
