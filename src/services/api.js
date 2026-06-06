
import { setItemSafe, getItemSafe, removeItemSafe } from "@/utils/storage";

// Change this to your Laravel server URL

import axios from "axios";

const BASE_URL = __DEV__ 
    ? 'http://192.168.2.1:8000/api'  // Your local IP for development
    : 'https://api.yourdomain.com/api'; // Production URL


const API = axios.create({
  baseURL: BASE_URL,  // 👈 replace with your LAN IP
  timeout: 10000,
});





class ApiService {
    constructor() {
        this.baseURL = BASE_URL;
    }

    async getToken() {
    return await getItemSafe('auth_token');
}

async setToken(token) {
    if (!token) return;
    await setItemSafe('auth_token', token);
}

async removeToken() {
    await removeItemSafe('auth_token');
}
    async request(endpoint, options = {}) {
        const token = await this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'Something went wrong',
                    errors: data.errors || {},
                };
            }

            return data;
        } catch (error) {
            if (error.status) throw error;
            throw { 
                status: 0, 
                message: 'Network error. Check your connection.' 
            };
        }
    }

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await this.setToken(data.token);
        return data;
    }

    async forgetpassword(email) {
        const data = await this.request('/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        return data;
    }

    async resetpassword(email, token, password, passwordConfirmation) {
        const data = await this.request('/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, token, password, password_confirmation: passwordConfirmation }),
        });
        return data;
    }

    async register(userData) {
    const data = await this.request('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });

    if (data.token) {
        await this.setToken(data.token);
    }

    return data;
}

    async logout() {
        await this.request('/logout', { method: 'POST' });
        await this.removeToken();
    }

    // Property endpoints
    async getProperties(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/properties?${params}`);
    }

    async getProperty(id) {
        return this.request(`/properties/${id}`);
    }

    async createProperty(propertyData) {
        return this.request('/properties', {
            method: 'POST',
            body: JSON.stringify(propertyData),
        });
    }

    async uploadPropertyImages(propertyId, images) {
        const token = await this.getToken();
        const formData = new FormData();
        
        images.forEach((image, index) => {
            formData.append(`images[${index}]`, {
                uri: image.uri,
                type: 'image/jpeg',
                name: `image_${index}.jpg`,
            });
        });

        const response = await fetch(`${BASE_URL}/properties/${propertyId}/images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        return response.json();
    }

    // Booking endpoints
    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    }

    async getBookings() {
        return this.request('/bookings');
    }

    // Favorites
    async addFavorite(propertyId) {
        return this.request(`/favorites/${propertyId}`, { method: 'POST' });
    }

    async removeFavorite(propertyId) {
        return this.request(`/favorites/${propertyId}`, { method: 'DELETE' });
    }

    async getFavorites() {
        return this.request('/favorites');
    }

    async getRegistrationStatus() {
        return this.request('/registrationStatus');
    }

    async updateEmail(data) {
    return this.request('/update-email', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

 async updatePhoneNumber(data) {
    return this.request('/update-phone-number', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}


 async verifyIdentity(data) {
    return this.request('/verify-identity', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}


async updateProfile(data) {
    return this.request('/profile/update', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async getIdCardTypes() {
    return this.request('/id-card-types');
}

async verifyIdCard(data) {
    return this.request('/verify-id-card', {
        method: 'POST',
        body: data,
        headers: { "Content-Type": "multipart/form-data" },
    });
}

async faceRecord(data) {
    return this.request('/face-record', {
        method: 'POST',
        body: data,
        headers: { "Content-Type": "multipart/form-data" },
    });
}

async verifyEmail(data) {
    return this.request('/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async resendEmailCode(data){
    return this.request('/resend-email-code', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

async kycLiveness(data) {
    return this.request('/kyc-liveness', {
        method: 'POST',
        body: data,
        headers: { },
    })
}

async getProperty(){
    return this.request('/property/dropdowns', {
        method: 'GET',
    })
}

async getPropertyArea(stateId){
    return this.request(`/property/area?state_id=${stateId}`, {
        method: 'GET',
    })
}
    

}
export default new ApiService();
export { API };
