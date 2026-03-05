export const verifyAdminPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            if (res.ok && data.success) {
                return { success: true };
            } else {
                const msg = data.error || data.message || 'Authentication failed';
                return { success: false, error: data.details ? `${msg} (${data.details})` : msg };
            }
        } catch (e) {
            console.error("Non-JSON Response from Admin API:", text);
            // If the server returns HTML (500 crash page), truncate it for display
            const preview = text.length > 50 ? text.substring(0, 50) + "..." : text;
            return { success: false, error: `Critical Server Error (${res.status}): ${preview}` };
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Network Error - Check your connection' };
    }
};

export const changeAdminPin = async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, newPin, action: 'change_pin' })
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            if (res.ok && data.success) {
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Failed to update PIN' };
            }
        } catch (e) {
            return { success: false, error: `Server Error (${res.status})` };
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Network Error' };
    }
};

export const setupAdmin = async (pin: string): Promise<boolean> => {
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, action: 'setup' })
        });
        return res.ok;
    } catch (error) {
        return false;
    }
}
