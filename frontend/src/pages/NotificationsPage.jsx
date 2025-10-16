import { useEffect, useState } from "react";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import {
  ArrowLeft,
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { useSockets } from "../context/SocketContext";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const { userSocket } = useSockets();

  const [friendRequests, setFriendRequests] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Fetch friend requests on mount
  useEffect(() => {
    setIsLoading(true);
    getFriendRequests()
      .then((data) => setFriendRequests(data))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    userSocket.on("friend_request_received", (request) => {
      setFriendRequests((prev) => ({
        ...prev,
        incomingRequests: [...(prev.incomingRequests || []), request],
      }));
    });

    userSocket.on("friend_request_accepted", (request) => {
      setFriendRequests((prev) => ({
        ...prev,
        acceptedRequests: [...(prev.acceptedRequests || []), request],
      }));
    });

    return () => {
      userSocket.off("friend_request_received");
      userSocket.off("friend_request_accepted");
    };
  }, []);

  // Accept friend request handler
  const handleAcceptRequest = async (requestId) => {
    setIsPending(true);
    try {
      await acceptFriendRequest(requestId);
      // Refetch friend requests after accepting
      const updated = await getFriendRequests();
      setFriendRequests(updated);
    } catch (err) {
      console.error("Error accepting friend request:", err);
      toast.error("Failed to accept friend request");
    }
    setIsPending(false);
  };

  const incomingRequests = friendRequests?.incomingRequests || [];
  const acceptedRequests = friendRequests?.acceptedRequests || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <button onClick={() => window.history.back()} className="md:hidden">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Notifications
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img
                                src={request.sender.profilePic}
                                alt={request.sender.fullName}
                              />
                            </div>

                            <div>
                              <h3 className="font-semibold">
                                {request.sender.fullName}
                              </h3>
                              <p className="text-sm text-base-content/70">
                                {request.sender.fullName} sent you a friend
                                request
                              </p>
                              <p className="text-xs flex items-center opacity-70">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {new Date(request.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={isPending}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.receiver.profilePic}
                              alt={notification.receiver.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {notification.receiver.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {notification.receiver.fullName} accepted your
                              friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
