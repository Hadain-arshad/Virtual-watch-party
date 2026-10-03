import AuthLogo from "../components/Auth/AuthLogo";
import AuthInput from "../components/Auth/AuthInput";
import AuthButton from "../components/Auth/AuthButton";
import { useState } from "react";
import { loginUser } from "../api";

function Login({ setScreen, onAuthenticated }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateField(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            onAuthenticated(await loginUser(form));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <AuthLogo />

                <form className="login-form" onSubmit={handleSubmit}>

                    <AuthInput
                        icon="♙"
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={updateField}
                    />

                    <AuthInput
                        icon="🔒"
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={updateField}
                    />

                    <div className="login-options">

                        <label>
                            <input type="checkbox" />
                            Remember Me
                        </label>

                        <span>
                            Forgot Password?
                        </span>

                    </div>

                    {error && <p className="form-error" role="alert">{error}</p>}

                    <AuthButton disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Login"}
                    </AuthButton>

                    <p className="account-text">
                        Don't have an account?

                        <button
                            type="button"
                            className="link-button"
                            onClick={() => setScreen("signup")}
                        >
                            Sign Up
                        </button>
                    </p>

                </form>

            </div>

        </div>
    );
}

export default Login;