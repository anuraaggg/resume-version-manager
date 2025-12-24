import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Squares from "../components/Squares";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      if (isRegister) {
        // REGISTER
        await api.post("/auth/register", { email, password });
        setIsRegister(false);
      } else {
        // LOGIN
        const res = await api.post("/auth/login", { email, password });

        localStorage.setItem("token", res.data.token);

        // 🔥 FORCE redirect (avoids dev-mode confusion)
        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="rgba(255, 255, 255, 0.05)"
        hoverFillColor="rgba(59, 130, 246, 0.1)"
      />
      <form
        onSubmit={handleSubmit}
        className="bg-gray-950 border border-gray-800 p-8 rounded-xl shadow-2xl w-96 space-y-5 relative z-10"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          {isRegister ? "Create Account" : "Sign In"}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {isRegister ? "Join us today" : "Welcome back"}
        </p>

        <input
          className="border border-gray-700 bg-gray-900 text-white rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent placeholder-gray-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="border border-gray-700 bg-gray-900 text-white rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent placeholder-gray-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white w-full py-3 rounded-lg font-medium disabled:opacity-60 transition-all duration-200"
        >
          {loading
            ? isRegister
              ? "Creating account..."
              : "Logging in..."
            : isRegister
            ? "Register"
            : "Login"}
        </button>

        <p className="text-sm text-center text-gray-500">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <span
            className="text-gray-300 cursor-pointer hover:text-white font-medium transition-colors"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Create account"}
          </span>
        </p>
      </form>
    </div>
  );
}
