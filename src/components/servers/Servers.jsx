/* eslint-disable react/prop-types */
import {
  faClosedCaptioning,
  faFile,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import BouncingLoader from "../ui/bouncingloader/Bouncingloader";
import "./Servers.css";

function Servers({
  servers,
  activeEpisodeNum,
  activeServerId,
  setActiveServerId,
  serverLoading,
  setActiveServerType,
  setActiveServerName,
}) {
  const { language } = useLanguage();
  const subServers =
    servers?.filter((server) => server.type === "sub") || [];
  const dubServers =
    servers?.filter((server) => server.type === "dub") || [];
  const rawServers =
    servers?.filter((server) => server.type === "raw") || [];

  const handleServerSelect = (server) => {
    setActiveServerId(server.data_id);
    setActiveServerType(server.type);
    setActiveServerName(server.serverName);
    // Save last watched server (separate from Settings preferences)
    localStorage.setItem("lastWatchedServer", server.serverName);
    localStorage.setItem("lastWatchedAudioType", server.type.toLowerCase());
    console.log('✅ User selected server:', server.serverName, 'Type:', server.type.toLowerCase());
  };

  return (
    <div className="relative bg-[#0a0a0a] p-4 w-full min-h-[100px] flex justify-center items-center max-[1200px]:bg-[#0a0a0a] max-[600px]:p-2">
      {serverLoading ? (
        <div className="w-full h-full rounded-lg flex justify-center items-center max-[600px]:rounded-none">
          <BouncingLoader />
        </div>
      ) : servers ? (
        <div className="w-full h-full rounded-lg grid grid-cols-[minmax(0,30%),minmax(0,70%)] overflow-hidden max-[800px]:grid-cols-[minmax(0,40%),minmax(0,60%)] max-[600px]:flex max-[600px]:flex-col max-[600px]:rounded-none max-[600px]:gap-2">
          <div className="h-full bg-[#0a0a0a] px-6 text-white flex flex-col justify-center items-center gap-y-2 max-[600px]:bg-transparent max-[600px]:h-auto max-[600px]:text-white max-[600px]:py-1 max-[600px]:px-2">
            <p className="text-center leading-5 font-medium text-[14px] max-[600px]:text-[13px] max-[600px]:mb-0">
              {getTranslation(language, "youAreWatching")}{" "}
              <br className="max-[600px]:hidden" />
              <span className="font-semibold max-[600px]:text-[#e0e0e0] max-[600px]:ml-1">
                {getTranslation(language, "episode")} {formatNumber(activeEpisodeNum, language)}
              </span>
            </p>
            <p className="leading-5 text-[14px] font-medium text-center max-[600px]:text-[12px] max-[600px]:mt-0">
              {getTranslation(language, "serverNotWork")}
            </p>
          </div>
          <div className="bg-[#0a0a0a] flex flex-col max-[600px] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors max-[600px]:p-2">
            {rawServers.length > 0 && (
              <div className={`servers px-2 flex items-center flex-wrap gap-y-1 ml-2 max-[600px]:py-1.5 max-[600px]:px-1 max-[600px]:ml-0 ${
                dubServers.length === 0 || subServers.length === 0
                  ? "h-1/2"
                  : "h-full"
              }`}>
                <div className="flex items-center gap-x-2 min-w-[65px]">
                  <FontAwesomeIcon
                    icon={faFile}
                    className="text-[#e0e0e0] text-[13px]"
                  />
                  <p className="font-bold text-[14px] max-[600px]:text-[12px]">{getTranslation(language, "raw")}</p>
                </div>
                <div className="flex gap-0.5 ml-2 flex-wrap max-[600px]:ml-0">
                  {rawServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer ${
                        activeServerId === item?.data_id
                          ? "bg-[#e0e0e0] text-black"
                          : "bg-[#000000] text-white"
                      } max-[700px]:px-3 max-[600px]:px-2 max-[600px]:py-1`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold max-[600px]:text-[12px]">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subServers.length > 0 && (
              <div className={`servers px-2 flex items-center flex-wrap gap-y-1 ml-2 max-[600px]:py-1.5 max-[600px]:px-1 max-[600px]:ml-0 ${
                dubServers.length === 0 ? "h-1/2" : "h-full"
              }`}>
                <div className="flex items-center gap-x-2 min-w-[65px]">
                  <FontAwesomeIcon
                    icon={faClosedCaptioning}
                    className="text-[#e0e0e0] text-[13px]"
                  />
                  <p className="font-bold text-[14px] max-[600px]:text-[12px]">{getTranslation(language, "sub")}</p>
                </div>
                <div className="flex gap-0.5 ml-2 flex-wrap max-[600px]:ml-0">
                  {subServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer ${
                        activeServerId === item?.data_id
                          ? "bg-[#e0e0e0] text-black"
                          : "bg-[#000000] text-white"
                      } max-[700px]:px-3 max-[600px]:px-2 max-[600px]:py-1`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold max-[600px]:text-[12px]">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dubServers.length > 0 && (
              <div className={`servers px-2 flex items-center flex-wrap gap-y-1 ml-2 max-[600px]:py-1.5 max-[600px]:px-1 max-[600px]:ml-0 ${
                subServers.length === 0 ? "h-1/2" : "h-full"
              }`}>
                <div className="flex items-center gap-x-2 min-w-[65px]">
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    className="text-[#e0e0e0] text-[13px]"
                  />
                  <p className="font-bold text-[14px] max-[600px]:text-[12px]">{getTranslation(language, "dub")}</p>
                </div>
                <div className="flex gap-0.5 ml-2 flex-wrap max-[600px]:ml-0">
                  {dubServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer ${
                        activeServerId === item?.data_id
                          ? "bg-[#e0e0e0] text-black"
                          : "bg-[#000000] text-white"
                      } max-[700px]:px-3 max-[600px]:px-2 max-[600px]:py-1`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold max-[600px]:text-[12px]">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center font-medium text-[15px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          Could not load servers <br />
          Either reload or try again after sometime
        </p>
      )}
    </div>
  );
}

export default Servers;
