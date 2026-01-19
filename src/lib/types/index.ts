export interface NoteAPIResponse {
    id: number,
    pos_x: string;
    pos_y: string;
    width: string;
    height: string;
    content: string;
    bg_color: string;
    created_at?: string;
    updated_at?: string;
}

export interface Note {
    id: number;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    content: string;
    bg_color: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateNoteData {
    pos_x: number;
    pos_y: number;
    width?: number;
    height?: number;
    content: string;
    bg_color?: string;
}

export interface UpdateNoteData {
    pos_x?: number;
    pos_y?: number;
    width?: number;
    height?: number;
    content?: string;
    bg_color?: string;
}

export interface ApiError {
    message: string;
    status: number;
}
