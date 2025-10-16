import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  CameraIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    onboardingMutation(formState);
  };


  const handleRandomAvatar = () => {
    const genders = ["male", "female"];
    const gender = genders[Math.floor(Math.random() * genders.length)];

    const idx = Math.floor(Math.random() * 100) + 1;

    const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${idx}&gender=${gender}`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };


  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-base-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-base-content">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PICTURE PREVIEW */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className="w-12 h-12 text-base-content/50" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRandomAvatar}
                className="flex items-center px-4 py-2 text-sm font-medium bg-primary text-primary-content rounded-md hover:bg-primary/80 transition"
              >
                <ShuffleIcon className="w-4 h-4 mr-2" />
                Generate Random Avatar
              </button>
            </div>

            {/* FULL NAME */}
            <div>
              <label className="block text-sm text-base-content mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="w-full rounded-md border border-base-300 bg-base-100 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your full name"
              />
            </div>

            {/* BIO */}
            <div>
              <label className="block text-sm text-base-content mb-1">Bio</label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="w-full rounded-md border border-base-300 bg-base-100 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Tell others about yourself and your language learning goals"
                rows={4}
              />
            </div>

            {/* LOCATION */}
            <div>
              <label className="block text-sm text-base-content mb-1">Location</label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 w-5 h-5" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) =>
                    setFormState({ ...formState, location: e.target.value })
                  }
                  className="w-full rounded-md border border-base-300 bg-base-100 pl-10 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/80 text-primary-content py-3 rounded-md font-semibold flex items-center justify-center transition"
            >
              {isPending ? (
                <>
                  <LoaderIcon className="animate-spin w-5 h-5 mr-2" />
                  Onboarding...
                </>
              ) : (
                <>
                  <ShipWheelIcon className="w-5 h-5 mr-2" />
                  Complete Onboarding
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
