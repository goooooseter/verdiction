export type Case = {
    id: number;
    title: string;
    description: string;
    status: 'active' | 'closed';
    created_at: string;
};