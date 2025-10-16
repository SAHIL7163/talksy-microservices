import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, Globe2 } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-100 border-b border-base-200 sticky top-0 z-50 h-16 flex items-center">
      <div className="w-full px-4 flex items-center justify-between">
        {/* LEFT: LOGO only on chat page */}
        {isChatPage ? (
          <Link to="/" className="flex items-center gap-2">
            <Globe2 className="size-8 text-primary flex-shrink-0" />
            <span className="text-2xl font-bold tracking-wider text-primary">
              Talksy
            </span>
          </Link>
        ) : (
          <div /> 
        )}

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Notifications */}
          <Link to="/notifications">
            <button className="btn btn-ghost btn-circle hover:bg-base-200 lg:hidden">
              <BellIcon className="h-6 w-6 text-base-content" />
            </button>
          </Link>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* User Avatar */}
          <div className="avatar">
            <div className="w-9 rounded-full overflow-hidden">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>

          {/* Logout button */}
          <button
            className="btn btn-ghost btn-circle hover:bg-base-200"
            onClick={logoutMutation}
          >
            <LogOutIcon className="h-6 w-6 text-base-content" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
