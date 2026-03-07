export const verifyPin = (pin: string): boolean => {
    const correctPin = process.env.ADMIN_PIN || '1234';
    return pin === correctPin;
};

export const changePin = (currentPin: string, newPin: string): boolean => {
    const correctPin = process.env.ADMIN_PIN || '1234';
    if (currentPin === correctPin && newPin && newPin.length >= 4) {
        // Ideally save to DB, but as per existing logic:
        return true;
    }
    return false;
};
