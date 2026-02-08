// ColorKey type must match the Rails enum names
export type ColorKey =
    | 'default'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'pink'
    | 'purple'
    | 'blue'
    | 'cyan'
    | 'green'
    | 'gray'

export interface NoteAPIResponse {
    id: number,
    pos_x: string;
    pos_y: string;
    width: string;
    height: string;
    content: string;
    color_index: ColorKey;
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
    color_index: ColorKey;
    created_at?: string;
    updated_at?: string;
}

export interface CreateNoteData {
    pos_x: number;
    pos_y: number;
    width?: number;
    height?: number;
    content: string;
    color_index?: ColorKey;
}

export interface UpdateNoteData {
    pos_x?: number;
    pos_y?: number;
    width?: number;
    height?: number;
    content?: string;
    color_index?: ColorKey;
}

export interface ApiError {
    message: string;
    status: number;
}
