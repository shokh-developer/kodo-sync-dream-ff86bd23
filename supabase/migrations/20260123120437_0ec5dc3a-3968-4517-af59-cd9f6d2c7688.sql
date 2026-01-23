-- Create files table for storing multiple files per room
CREATE TABLE public.files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '/',
    content TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'javascript',
    is_folder BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(room_id, path, name)
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Public access for files (same as rooms)
CREATE POLICY "Anyone can view files" 
ON public.files 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create files" 
ON public.files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update files" 
ON public.files 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete files" 
ON public.files 
FOR DELETE 
USING (true);

-- Enable realtime for files table
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();