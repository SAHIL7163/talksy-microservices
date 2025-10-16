import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Link } from "react-router";
import useSignUp from "../hooks/useSignup";

const SignUpPage = () => {
    const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-base-200 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
      
        <div className="hidden lg:flex bg-base-300 text-base-content flex-col justify-center items-center p-10 space-y-6">
          <Globe2 className="w-16 h-16 text-primary" />
          <h1 className="text-3xl font-extrabold tracking-tight max-w-xs text-center text-primary">
            Chat. Call. Connect
          </h1>

          <img src="/i.png" alt="Language learning" className="w-48 mt-6" />
        </div>

        {/* Right Side - Form + Icon/Name */}
        <div className="p-10 flex flex-col justify-center bg-base-100">
          <div className="flex items-center mb-8 space-x-3">
            <Globe2 className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              Talksy
            </h1>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response?.data?.message || "Signup failed"}</span>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-2 text-base-content">Create an Account</h2>
          <p className="text-base-content mb-8">Start your language journey with us!</p>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-base-content mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
                required
                className="w-full rounded-md border border-base-300 bg-base-200 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-base-content mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
                className="w-full rounded-md border border-base-300 bg-base-200 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="********"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
                className="w-full rounded-md border border-base-300 bg-base-200 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-base-content/60 mt-1">Minimum 6 characters</p>
            </div>
            <button
              className="w-full bg-primary text-primary-content py-3 rounded-md text-lg font-semibold hover:bg-primary/80 transition"
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-base-content">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;