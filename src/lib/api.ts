const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    access_token: string;
    admin_id: string;
    role: string;
    name: string;
}

class AdminAPI {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('admin_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
        }
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            const errorMessage = typeof error.detail === 'string'
                ? error.detail
                : typeof error.detail === 'object'
                    ? JSON.stringify(error.detail)
                    : 'Request failed';
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // Authentication
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const data = await this.request('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.setToken(data.access_token);
        return data;
    }

    logout() {
        this.clearToken();
    }

    // Dashboard
    async getDashboard() {
        return this.request('/api/admin/dashboard');
    }

    // Banks
    async getBanks(params?: { page?: number; state?: string; is_verified?: boolean; is_subscribed?: boolean; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.state) queryParams.set('state', params.state);
        if (params?.is_verified !== undefined) queryParams.set('is_verified', params.is_verified.toString());
        if (params?.is_subscribed !== undefined) queryParams.set('is_subscribed', params.is_subscribed.toString());
        if (params?.search) queryParams.set('search', params.search);

        return this.request(`/api/admin/banks?${queryParams.toString()}`);
    }

    async getBank(bankId: string) {
        return this.request(`/api/admin/banks/${bankId}`);
    }

    async verifyBank(bankId: string, verifiedBy: string, notes?: string) {
        return this.request(`/api/admin/banks/${bankId}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ verified_by: verifiedBy, notes }),
        });
    }

    async updateSubscription(bankId: string, data: {
        subscription_tier: string;
        subscription_started_at: string;
        subscription_expires_at: string;
        notes?: string;
    }) {
        return this.request(`/api/admin/banks/${bankId}/subscription`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async verifyBankDocument(bankId: string, docIndex: number, notes?: string) {
        return this.request(`/api/admin/banks/${bankId}/documents/${docIndex}/verify`, {
            method: 'PUT',
            body: JSON.stringify({
                notes,
                document_url: "index_based_verification" // Required by backend schema but ignored for bank docs
            }),
        });
    }

    async rejectBankDocument(bankId: string, docIndex: number, reason: string) {
        return this.request(`/api/admin/banks/${bankId}/documents/${docIndex}/reject`, {
            method: 'PUT',
            body: JSON.stringify({
                reason,
                document_url: "index_based_verification" // Required by backend schema but ignored for bank docs
            }),
        });
    }

    // Donors
    async getDonors(params?: { page?: number; state?: string; bank_id?: string; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.state) queryParams.set('state', params.state);
        if (params?.bank_id) queryParams.set('bank_id', params.bank_id);
        if (params?.search) queryParams.set('search', params.search);

        return this.request(`/api/admin/donors?${queryParams.toString()}`);
    }

    async getDonor(donorId: string) {
        return this.request(`/api/admin/donors/${donorId}`);
    }

    // Activity Logs
    async getActivityLogs(params?: { page?: number; entity_type?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.entity_type) queryParams.set('entity_type', params.entity_type);

        return this.request(`/api/admin/activity-logs?${queryParams.toString()}`);
    }

    // Subscription Analytics
    async getSubscriptionAnalytics() {
        return this.request('/api/admin/subscriptions/analytics');
    }

    // Enhanced Bank Management
    async getBankFullDetails(bankId: string) {
        return this.request(`/api/admin/banks/${bankId}/full`);
    }

    async updateBank(bankId: string, data: {
        name?: string;
        phone?: string;
        address?: string;
        website?: string;
        description?: string;
        logo_url?: string;
    }) {
        return this.request(`/api/admin/banks/${bankId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async changeBankState(bankId: string, toState: string, reason?: string) {
        return this.request(`/api/admin/banks/${bankId}/state`, {
            method: 'PUT',
            body: JSON.stringify({ to_state: toState, reason }),
        });
    }

    // Enhanced Donor Management
    async getDonorFullDetails(donorId: string) {
        return this.request(`/api/admin/donors/${donorId}/full`);
    }

    async updateDonor(donorId: string, data: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        email?: string;
        address?: string;
        date_of_birth?: string;
    }) {
        return this.request(`/api/admin/donors/${donorId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateDonorEligibility(donorId: string, eligibilityStatus: string, notes?: string) {
        return this.request(`/api/admin/donors/${donorId}/eligibility`, {
            method: 'PUT',
            body: JSON.stringify({ eligibility_status: eligibilityStatus, eligibility_notes: notes }),
        });
    }

    // Subscription Management
    async getAllSubscriptions(activeOnly: boolean = false) {
        const queryParams = new URLSearchParams();
        if (activeOnly) queryParams.set('active_only', 'true');
        return this.request(`/api/admin/subscriptions?${queryParams.toString()}`);
    }

    async createOrUpdateSubscription(bankId: string, data: {
        subscription_tier: string;
        subscription_started_at: string;
        subscription_expires_at: string;
        billing_details?: any;
    }) {
        return this.request(`/api/admin/subscriptions/${bankId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async cancelSubscription(bankId: string) {
        return this.request(`/api/admin/subscriptions/${bankId}`, {
            method: 'DELETE',
        });
    }

    // Document Verification
    // Document Verification
    async verifyDocument(entityType: 'bank' | 'donor', entityId: string, documentUrl: string, notes?: string) {
        // Only Donor verified for now
        const endpoint = `/api/admin/${entityType}s/${entityId}/documents/verify`;
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ document_url: documentUrl, notes }),
        });
    }

    async rejectDocument(entityType: 'bank' | 'donor', entityId: string, documentUrl: string, reason: string) {
        const endpoint = `/api/admin/${entityType}s/${entityId}/documents/reject`;
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ document_url: documentUrl, reason }),
        });
    }

    // Consent Management
    async approveConsent(donorId: string, notes?: string) {
        return this.request(`/api/admin/donors/${donorId}/consent/approve`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
    }

    async rejectConsent(donorId: string, reason: string) {
        return this.request(`/api/admin/donors/${donorId}/consent/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    }

    // Test Results Management
    async approveTests(donorId: string, notes?: string) {
        return this.request(`/api/admin/donors/${donorId}/tests/approve`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
    }

    async rejectTests(donorId: string, reason: string) {
        return this.request(`/api/admin/donors/${donorId}/tests/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    }

    // Individual Test Report Management
    async approveTestReport(donorId: string, reportId: string, notes?: string) {
        return this.request(`/api/admin/donors/${donorId}/tests/${reportId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
    }

    async rejectTestReport(donorId: string, reportId: string, reason: string) {
        return this.request(`/api/admin/donors/${donorId}/tests/${reportId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    }

    // Subscription Plans Management
    async getSubscriptionPlans() {
        return this.request('/api/admin/subscription-plans');
    }

    async createSubscriptionPlan(data: {
        id: string;
        name: string;
        price: number;
        features?: string[];
        max_donors?: number | null;
        description?: string;
    }) {
        return this.request('/api/admin/subscription-plans', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSubscriptionPlan(planId: string, data: {
        name?: string;
        price?: number;
        features?: string[];
        max_donors?: number | null;
        description?: string;
    }) {
        return this.request(`/api/admin/subscription-plans/${planId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteSubscriptionPlan(planId: string) {
        return this.request(`/api/admin/subscription-plans/${planId}`, {
            method: 'DELETE',
        });
    }

    // CRUD Operations - Donors
    async createDonor(data: {
        email?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        address?: string;
        date_of_birth?: string;
    }, bankId?: string) {
        const queryParams = new URLSearchParams();
        if (bankId) queryParams.set('bank_id', bankId);

        return this.request(`/api/admin/donors?${queryParams.toString()}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateDonorInfo(donorId: string, data: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        email?: string;
        address?: string;
        date_of_birth?: string;
    }) {
        return this.request(`/api/admin/donors/${donorId}/update`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteDonor(donorId: string) {
        return this.request(`/api/admin/donors/${donorId}`, {
            method: 'DELETE',
        });
    }

    // CRUD Operations - Banks
    async deleteBank(bankId: string) {
        return this.request(`/api/admin/banks/${bankId}`, {
            method: 'DELETE',
        });
    }

    // Document Management
    async getPendingDocuments(docType?: 'certification' | 'consent' | 'test_report') {
        const queryParams = new URLSearchParams();
        if (docType) queryParams.set('doc_type', docType);

        return this.request(`/api/admin/documents/pending?${queryParams.toString()}`);
    }

    // Storage - Get document URL
    async getDocumentUrl(bucket: string, filePath: string) {
        // This would typically call your backend to get a signed URL from Supabase
        return this.request(`/api/admin/documents/url?bucket=${bucket}&path=${encodeURIComponent(filePath)}`);
    }

    // Storage - Get bank certification documents from storage
    async getBankStorageDocuments(bankId: string) {
        return this.request(`/api/admin/banks/${bankId}/storage-documents`);
    }

    // Storage - Get donor documents from storage
    async getDonorStorageDocuments(donorId: string) {
        return this.request(`/api/admin/donors/${donorId}/storage-documents`);
    }

    // Get signed URL for a document
    async getSignedDocumentUrl(bucket: string, path: string) {
        const queryParams = new URLSearchParams();
        queryParams.set('bucket', bucket);
        queryParams.set('path', path);
        return this.request(`/api/admin/documents/signed-url?${queryParams.toString()}`);
    }
}

export const api = new AdminAPI();
export default api;
