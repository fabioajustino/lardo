import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  name: string;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export const StarRating = ({ value, onChange, name, size = "md", readonly = false }: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={cn(
            "transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-smooth",
              (star <= (hover || value))
                ? "fill-primary text-primary"
                : "fill-muted text-muted-foreground"
            )}
          />
          <span className="sr-only">{star} star{star !== 1 ? 's' : ''} for {name}</span>
        </button>
      ))}
    </div>
  );
};