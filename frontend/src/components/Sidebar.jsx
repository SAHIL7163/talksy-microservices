import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, Globe2, UsersIcon } from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0 text-base-content">
      {/* Logo */}
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <Globe2 className="size-9 text-primary" />
          <span className="text-2xl font-bold tracking-wider text-primary">
            Talksy
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            currentPath === "/"
              ? "bg-primary text-primary-content"
              : "hover:bg-base-300 text-base-content"
          }`}
        >
          <HomeIcon className="size-5 opacity-70 text-inherit" />
          <span>Home</span>
        </Link>

        <Link
          to="/notifications"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            currentPath === "/notifications"
              ? "bg-primary text-primary-content"
              : "hover:bg-base-300 text-base-content"
          }`}
        >
          <BellIcon className="size-5 opacity-70 text-inherit" />
          <span>Notifications</span>
        </Link>
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full overflow-hidden">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="size-2 rounded-full bg-green-500 inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
