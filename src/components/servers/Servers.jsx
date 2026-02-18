/* eslint-disable react/prop-types */
import {
  faClosedCaptioning,
  faFile,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BouncingLoader from "../ui/bouncingloader/Bouncingloader";
import "./Servers.css";
import { useEffect } from "react";

function Servers({
  servers,
  activeEpisodeNum,
  activeServerId,
  setActiveServerId,
  serverLoading,
  setActiveServerType,
  setActiveServerName,
}) {
  const subServers = servers?.filter((s) => s.type === "sub") || [];
  const dubServers = servers?.filter((s) => s.type === "dub") || [];
  const rawServers = servers?.filter((s) => s.type === "raw") || [];

  useEffect(() => {
    const savedServerName = localStorage.getItem("server_name");
    if (savedServerName) {
      const matchingServer = servers?.find((s) => s.serverName === savedServerName);
      if (matchingServer) {
        setActiveServerId(matchingServer.data_id);
        setActiveServerType(matchingServer.type);
      } else if (servers?.length > 0) {
        const defaultServer = servers.find((s) => s.serverName === "HD-2") || servers[0];
        setActiveServerId(defaultServer.data_id);
        setActiveServerType(defaultServer.type);
      }
    } else if (servers?.length > 0) {
      const defaultServer = servers.find((s) => s.serverName === "HD-2") || servers[0];
      setActiveServerId(defaultServer.data_id);
      setActiveServerType(defaultServer.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers]);

  const handleServerSelect = (server) => {
    setActiveServerId(server.data_id);
    setActiveServerType(server.type);
    setActiveServerName(server.serverName);
    localStorage.setItem("server_name", server.serverName);
    localStorage.setItem("server_type", server.type);
  };

  const ServerButton = ({ item }) => (
    <button
      onClick={() => handleServerSelect(item)}
      className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 border ${
        activeServerId === item?.data_id
          ? "bg-white text-black border-white"
          : "bg-transparent text-white/70 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5"
      } max-[600px]:px-3 max-[600px]:py-1 max-[600px]:text-[12px]`}
    >
      {item.serverName}
    </button>
  );

  const ServerRow = ({ icon, label, servers: list }) =>
    list.length > 0 ? (
      <div className="servers flex items-center flex-wrap gap-2 py-2 max-[600px]:py-1.5">
        <div className="flex items-center gap-1.5 min-w-[55px]">
          <FontAwesomeIcon icon={icon} className="text-white/40 text-[12px]" />
          <p className="font-semibold text-[13px] text-white/60 max-[600px]:text-[12px]">{label}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {list.map((item, index) => (
            <ServerButton key={index} item={item} />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative bg-[#0a0a0a] border border-white/5 rounded-lg p-4 w-full min-h-[80px] flex justify-center items-center max-[600px]:p-3">
      {serverLoading ? (
        <div className="w-full flex justify-center items-center py-4">
          <BouncingLoader />
        </div>
      ) : servers ? (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-white/50 text-[13px]">
              You are watching:{" "}
              <span className="text-white font-medium">Episode {activeEpisodeNum}</span>
            </p>
            <p className="text-white/30 text-[12px] max-[600px]:hidden">
              · If server doesn&apos;t work, try another
            </p>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            <ServerRow icon={faFile} label="RAW:" servers={rawServers} />
            <ServerRow icon={faClosedCaptioning} label="SUB:" servers={subServers} />
            <ServerRow icon={faMicrophone} label="DUB:" servers={dubServers} />
          </div>
        </div>
      ) : (
        <p className="text-center font-medium text-[15px] text-white/40">
          Could not load servers. Reload or try again.
        </p>
      )}
    </div>
  );
}

export default Servers;
