function AuthInput({ icon, type, placeholder, name, value, onChange, required = true }) {
    return (
        <div className="auth-input">

            <span className="input-icon">
                {icon}
            </span>

            <input
                type={type}
                placeholder={placeholder}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
            />

        </div>
    );
}

export default AuthInput;