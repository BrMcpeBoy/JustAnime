import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LogoutSuccess() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#0a0a0a] px-4">
      <div className="flex flex-col w-fit h-fit items-center justify-center mx-auto">
        {isLoading && (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-16 h-16 text-[#22b2ff] mb-6 animate-spin"
            />
            <h2 className="font-bold text-white text-[32px] tracking-tight text-center">Logging out</h2>
          </>
        )}

        {!isLoading && (
          <>
            <div className="w-[300px] h-[300px] max-[500px]:w-[200px] max-[500px]:h-[200px] relative overflow-hidden rounded-lg">
              <img
                src="https://media1.tenor.com/m/MSlshZS6CVYAAAAC/satoru-gojo---correndo.gif"
                alt="Logout Success"
                className="w-full h-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <h1 className="font-bold text-white text-[32px] mt-8 tracking-tight text-center">Logout Success</h1>
            <p className="text-green-400 text-lg mt-2 text-center">You have been logged out successfully.</p>
          </>
        )}

        {!isLoading && (
          <button
            onClick={() => navigate("/home")}
            className="mt-8 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 py-2 px-4 w-fit rounded-3xl flex items-center gap-x-2"
          >
            <span className="text-[18px]">Back to homepage</span>
          </button>
        )}
      </div>
    </div>
  );
}
