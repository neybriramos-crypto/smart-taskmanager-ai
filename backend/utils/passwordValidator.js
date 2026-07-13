const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[.!$#%*])[A-Za-z\d.!$#%*]{9,}$/;

function validatePassword(password) {
    if (typeof password !== 'string') {
        return { valid: false, error: 'La contraseña es obligatoria.' };
    }

    if (password.length < 9) {
        return { valid: false, error: 'La contraseña debe tener más de 8 caracteres.' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'La contraseña debe incluir al menos una mayúscula.' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'La contraseña debe incluir al menos una minúscula.' };
    }

    if (!/\d/.test(password)) {
        return { valid: false, error: 'La contraseña debe incluir al menos un número.' };
    }

    if (!/[.!$#%*]/.test(password)) {
        return { valid: false, error: 'La contraseña debe incluir al menos un carácter especial: . ! $ # % *' };
    }

    if (!PASSWORD_REGEX.test(password)) {
        return { valid: false, error: 'La contraseña solo puede usar letras, números y estos caracteres especiales: . ! $ # % *' };
    }

    return { valid: true };
}

module.exports = { validatePassword };
