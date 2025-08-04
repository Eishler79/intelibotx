import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simulación de login exitoso
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded shadow-md w-96 text-center">
        <h1 className="text-3xl font-bold mb-4">Inicia sesión</h1>
        <button
          onClick={handleLogin}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded w-full"
        >
          Entrar con Binance
        </button>
      </div>
    </div>
  );
};

export default Login;