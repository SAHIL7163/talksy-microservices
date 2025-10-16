import { Globe2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-base-200 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Section - Illustration */}
        <div className="hidden lg:flex bg-base-300 text-base-content flex-col justify-center items-center p-10 space-y-6">
          <Globe2 className="w-16 h-16 text-primary" />
          <h1 className="text-3xl font-extrabold tracking-tight max-w-xs text-center text-primary">
            Chat. Call. Connect
          </h1>

          <img src="/i.png" alt="Language learning" className="w-48 mt-6" />
        </div>

        {/* Right Section - Login Form */}
        <div className="p-10 flex flex-col justify-center bg-base-100">
          <div className="flex items-center mb-8 space-x-3">
            <Globe2 className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              Talksy
            </h1>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response?.data?.message || "Login failed"}</span>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-2 text-base-content">
            Welcome Back
          </h2>
          <p className="text-base-content mb-8">
            Sign in to your account connect random people.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-base-content mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="sahildhameja13@gmail.com"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
                className="w-full rounded-md border border-base-300 bg-base-200 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-base-content mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="********"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
                className="w-full rounded-md border border-base-300 bg-base-200 px-4 py-2 text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-content py-3 rounded-md text-lg font-semibold hover:bg-primary/80 transition"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-base-content">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
