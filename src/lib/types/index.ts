export interface NoteAPIResponse {
    id: number,
    pos_x: string;
    pos_y: string;
    width: string;
    height: string;
    content: string;
    color_index: string;  // Rails enum string: 'default' | 'blue' | ...
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
    color_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateNoteData {
    pos_x: number;
    pos_y: number;
    width?: number;
    height?: number;
    content: string;
    color_index?: number;
}

export interface UpdateNoteData {
    pos_x?: number;
    pos_y?: number;
    width?: number;
    height?: number;
    content?: string;
    color_index?: number;
}

export interface ApiError {
    message: string;
    status: number;
}
