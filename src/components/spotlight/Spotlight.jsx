import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState, useEffect } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Spotlight.css";
import Banner from "../banner/Banner";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import getNextEpisodeSchedule from "@/src/utils/getNextEpisodeSchedule.utils";

const Spotlight = ({ spotlights }) => {
  const { language } = useLanguage();
  const [spotlightsWithSchedule, setSpotlightsWithSchedule] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!spotlights || spotlights.length === 0) return;
      
      const updatedSpotlights = await Promise.all(
        spotlights.map(async (spotlight) => {
          try {
            const scheduleData = await getNextEpisodeSchedule(spotlight.id);
            return {
              ...spotlight,
              nextEpisodeSchedule: scheduleData?.nextEpisodeSchedule || null,
              nextEpisodeNumber: scheduleData?.nextEpisode || null
            };
          } catch (error) {
            console.error('Error fetching schedule for spotlight:', spotlight.id, error);
            return spotlight;
          }
        })
      );
      
      setSpotlightsWithSchedule(updatedSpotlights);
    };

    fetchSchedules();
  }, [spotlights]);

  const displaySpotlights = spotlightsWithSchedule.length > 0 ? spotlightsWithSchedule : spotlights;

  return (
    <>
      <div className="relative h-[430px] max-[1390px]:h-[380px] max-[1300px]:h-[330px] max-md:h-[280px] pt-[8px]">
        {displaySpotlights && displaySpotlights.length > 0 ? (
          <>
            <Swiper
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              allowTouchMove={true}
              navigation={{
                nextEl: ".button-next",
                prevEl: ".button-prev",
              }}
              pagination={{
                clickable: true,
                dynamicBullets: false,
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              modules={[Navigation, Autoplay, Pagination]}
              className="h-[430px] max-[1390px]:h-full rounded-2xl overflow-hidden relative"
              style={{
                "--swiper-pagination-bullet-inactive-color": "rgba(255, 255, 255, 0.5)",
                "--swiper-pagination-bullet-inactive-opacity": "1",
              }}
            >
              <div className="absolute right-[20px] top-[20px] flex space-x-2 z-[5] max-md:right-[10px] max-md:top-[15px] max-md:space-x-1.5">
                <button className="button-prev bg-black/30 backdrop-blur-md text-white p-3 rounded-lg hover:bg-black/40 hover:backdrop-blur-lg border border-white/30 hover:border-white/50 transition-all duration-300 max-md:p-2.5">
                  <FaChevronLeft className="text-base max-md:text-sm" />
                </button>
                <button className="button-next bg-black/30 backdrop-blur-md text-white p-3 rounded-lg hover:bg-black/40 hover:backdrop-blur-lg border border-white/30 hover:border-white/50 transition-all duration-300 max-md:p-2.5">
                  <FaChevronRight className="text-base max-md:text-sm" />
                </button>
              </div>
              {displaySpotlights.map((item, index) => (
                <SwiperSlide className="text-black relative" key={index}>
                  <Banner item={item} index={index} />
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <p>{getTranslation(language, "noSpotlights")}</p>
        )}
      </div>
    </>
  );
};

export default Spotlight;
