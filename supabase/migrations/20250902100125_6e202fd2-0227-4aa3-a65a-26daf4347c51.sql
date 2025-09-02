-- Enable RLS on feedbacks table
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (customers can submit feedback)
CREATE POLICY "Anyone can insert feedback" 
ON public.feedbacks 
FOR INSERT 
WITH CHECK (true);

-- Allow public reads (admin panel needs to read all feedbacks)
CREATE POLICY "Anyone can read feedback" 
ON public.feedbacks 
FOR SELECT 
USING (true);