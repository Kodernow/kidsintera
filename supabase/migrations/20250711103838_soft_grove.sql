-- Create flashcard_categories table
CREATE TABLE public.flashcard_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    color text NOT NULL,
    icon text NOT NULL,
    age_group text NOT NULL,
    model_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for flashcard_categories
ALTER TABLE public.flashcard_categories ENABLE ROW LEVEL SECURITY;

-- Policy for flashcard_categories: Admins can do everything
CREATE POLICY "Admins can manage flashcard_categories"
ON public.flashcard_categories
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

-- Create flashcards table
CREATE TABLE public.flashcards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    sound_url text NOT NULL,
    pronunciation text,
    spelling text NOT NULL,
    difficulty text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_category
        FOREIGN KEY (category_id)
        REFERENCES public.flashcard_categories(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- Enable Row Level Security for flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Policy for flashcards: Admins can do everything
CREATE POLICY "Admins can manage flashcards"
ON public.flashcards
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE));