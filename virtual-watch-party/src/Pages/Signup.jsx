import AuthLogo from "../components/Auth/AuthLogo";
import AuthInput from "../components/Auth/AuthInput";
import AuthButton from "../components/Auth/AuthButton";
import { useState } from "react";
import { signupUser } from "../api";

function Signup({ setScreen, onAuthenticated }) {
    const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "", gender: "" });
    const [picture, setPicture] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateField(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => data.append(key, value));
        if (picture) data.append("profile_picture", picture);
        try {
            onAuthenticated(await signupUser(data));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card signup-card">

                <AuthLogo />

                <form className="signup-form" onSubmit={handleSubmit}>

                    <label className="profile-upload">
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPicture(event.target.files[0])} />
                        {picture ? picture.name : "📷"}
                    </label>

                    <p className="profile-text">
                        {picture ? "Profile Picture Selected" : "Add Profile Picture"}
                    </p>
                   <br />

                    <AuthInput
                        icon="♙"
                        type="text"
                        name="full_name"
                        placeholder="Full Name"
                        value={form.full_name}
                        onChange={updateField}
                    />

                    <AuthInput
                        icon="✉"
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={updateField}
                    />

                    <div className="gender-box">

                        <p>Gender</p>

                        <label>
                            <input type="radio" name="gender" value="Male" checked={form.gender === "Male"} onChange={updateField} />
                            Male
                        </label>

                        <label>
                            <input type="radio" name="gender" value="Female" checked={form.gender === "Female"} onChange={updateField} />
                            Female
                        </label>

                    </div>

                    <AuthInput
                        icon="🔒"
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={updateField}
                    />

                    <AuthInput
                        icon="🔒"
                        type="password"
                        name="confirm_password"
                        placeholder="Confirm Password"
                        value={form.confirm_password}
                        onChange={updateField}
                    />

                    <label className="terms">

                        <input type="checkbox" />

                        <span>
                            I agree to the{" "} 
                            <a href="#">
                                 Terms & Conditions and Privacy policy
                            </a>
                           
                        </span>

                    </label>

                    {error && <p className="form-error" role="alert">{error}</p>}
                    <AuthButton disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create Account"}</AuthButton>

                    <p className="account-text">
                        Already have an account?

                        <button
                            type="button"
                            className="link-button"
                            onClick={() => setScreen("login")}
                        >
                            Login
                        </button>
                    </p>

                </form>

            </div>

        </div>
    );
}

export default Signup;