import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  MessageSquareIcon,
} from "lucide-react";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import useAuthUser from "../hooks/useAuthUser";
import { useSockets } from "../context/SocketContext";
import toast from "react-hot-toast";

const HomePage = () => {
  const { authSocket, userSocket, chatSocket } = useSockets();
  const { authUser } = useAuthUser();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [outgoingFriendReqs, setOutgoingFriendReqs] = useState([]);
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [isPending, setIsPending] = useState(false);

  // Register socket on mount
  useEffect(() => {
    if (authUser && authUser._id) {
      chatSocket.emit("register", { userId: authUser._id });
    }
  }, [authUser]);

  // Fetch initial data
  useEffect(() => {
    setLoadingFriends(true);
    getUserFriends()
      .then((data) => setFriends(data || []))
      .finally(() => setLoadingFriends(false));

    setLoadingUsers(true);
    getRecommendedUsers()
      .then((data) => setRecommendedUsers(data || []))
      .finally(() => setLoadingUsers(false));

    getOutgoingFriendReqs().then((data) => setOutgoingFriendReqs(data || []));
  }, []);

  // Listen to socket events
  useEffect(() => {
    authSocket.on("user:joined", (user) => {
      setRecommendedUsers((prev) => [...prev, user]);
    });

    userSocket.on("friend_request_accepted", (request) => {
      const acceptedId = String(request._id);

      setOutgoingFriendReqs((prev) =>
        prev.filter((req) => {
          const reqId = String(req._id);
          return reqId !== acceptedId;
        })
      );

      setOutgoingRequestsIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(String(request.receiver?._id));
        return newSet;
      });

      setRecommendedUsers((prev) =>
        prev.map((user) =>
          user._id === request.receiver?._id
            ? { ...user, requestSent: false }
            : user
        )
      );

      setFriends((prev) => [...prev, request.receiver]);
    });

    return () => {
      authSocket.off("user:joined");
      userSocket.off("friend_request_received");
      userSocket.off("friend_request_accepted");
    };
  }, []);

  // Update outgoingRequestsIds whenever outgoingFriendReqs changes
  useEffect(() => {
    const outgoingIds = new Set(
      outgoingFriendReqs.map((req) => String(req.receiver?._id))
    );
    setOutgoingRequestsIds(outgoingIds);
  }, [outgoingFriendReqs]);

  // Send friend request
  const handleSendFriendRequest = async (userId) => {
    setIsPending(true);
    try {
      const req = await sendFriendRequest(userId);
      setOutgoingFriendReqs((prev) => [...prev, req]);
      setOutgoingRequestsIds((prev) => new Set([...prev, userId]));
      setRecommendedUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, requestSent: true } : user
        )
      );
      toast.success("Friend request sent successfully!");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error(err.message || "Failed to send friend request");
    }
    setIsPending(false);
  };

  return (
    <div className="min-h-screen w-full bg-base-100 relative">
      <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen w-full">
        <div className="container mx-auto max-w-7xl space-y-8 lg:space-y-12">
          {/* Friends Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-base-content">
                Your Friends
              </h1>
            </div>
            <Link
              to="/notifications"
              className="btn btn-outline btn-sm sm:btn-md hover:btn-primary transition-all duration-200"
            >
              <UsersIcon className="mr-2 size-4" />
              Friend Requests
            </Link>
          </div>

          {/* Friends Grid */}
          <section className="w-full">
            {loadingFriends ? (
              <div className="flex justify-center items-center py-16 sm:py-24">
                <div className="text-center space-y-4">
                  <span className="loading loading-spinner loading-lg text-primary" />
                  <p className="text-base-content/60">
                    Loading your friends...
                  </p>
                </div>
              </div>
            ) : friends.length === 0 ? (
              <NoFriendsFound />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                {friends.map((friend) => (
                  <FriendCard key={friend._id} friend={friend} />
                ))}
              </div>
            )}
          </section>

          {/* Recommended Users */}
          <section className="w-full">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-base-content">
                Meet New Friends
              </h2>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center items-center py-16 sm:py-24">
                <div className="text-center space-y-4">
                  <span className="loading loading-spinner loading-lg text-primary" />
                  <p className="text-base-content/60">
                    Finding language partners...
                  </p>
                </div>
              </div>
            ) : recommendedUsers.length === 0 ? (
              <div className="w-full max-w-md mx-auto">
                <div className="card bg-base-200 shadow-md">
                  <div className="card-body p-6 sm:p-8 text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-base-300 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-8 h-8 text-base-content/50" />
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-base-content">
                      No recommendations available
                    </h3>
                    <p className="text-base-content/70 text-sm sm:text-base">
                      Check back later for new friends!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {recommendedUsers.map((user) => {
                  const hasRequestBeenSent =
                    outgoingRequestsIds.has(user._id) || user.requestSent;

                  return (
                    <div
                      key={user._id}
                      className="card bg-base-200 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border border-base-300/50 hover:border-primary/20 w-full"
                    >
                      <div className="card-body p-4 sm:p-6 space-y-4 h-full flex flex-col">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-base-300">
                              <img
                                src={user.profilePic}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg text-base-content truncate">
                              {user.fullName}
                            </h3>
                            {user.location && (
                              <div className="flex items-center text-xs sm:text-sm text-base-content/70 mt-1">
                                <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {user.location}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {user.bio && (
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm text-base-content/70 line-clamp-3">
                              {user.bio}
                            </p>
                          </div>
                        )}
                        <div className="mt-auto pt-2">
                          <button
                            className={`btn w-full text-xs sm:text-sm ${
                              hasRequestBeenSent
                                ? "btn-disabled bg-success/20 text-success"
                                : "btn-primary hover:btn-primary-focus"
                            } transition-all duration-200`}
                            onClick={() => handleSendFriendRequest(user._id)}
                            disabled={hasRequestBeenSent || isPending}
                          >
                            {isPending && !hasRequestBeenSent ? (
                              <>
                                <span className="loading loading-spinner loading-sm mr-2" />
                                Sending...
                              </>
                            ) : hasRequestBeenSent ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Request Sent
                              </>
                            ) : (
                              <>
                                <UserPlusIcon className="w-4 h-4 mr-2" />
                                Send Friend Request
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Chat with AI Button */}
      <Link
        to="/ai-chat"
        className="fixed bottom-6 right-6 btn btn-primary btn-md shadow-lg hover:btn-primary-focus transition-all duration-200 flex items-center gap-2"
        title="Chat with AI"
      >
        <MessageSquareIcon className="w-5 h-5" />
        <span>Chat with AI</span>
      </Link>
    </div>
  );
};

export default HomePage;
