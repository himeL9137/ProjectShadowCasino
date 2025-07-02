import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, Check, Search, Eye, EyeOff } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, icon, iconPosition = 'left', clearable, onClear, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;

    const hasLeftIcon = icon && iconPosition === 'left';
    const hasRightIcon = icon && iconPosition === 'right';
    const hasPasswordToggle = isPassword;
    const hasClearButton = clearable && props.value;

    return (
      <div className="relative">
        {/* Left Icon */}
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={actualType}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-all duration-200",
            "placeholder:text-muted-foreground/70 placeholder:opacity-100 focus:placeholder:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Icon spacing
            hasLeftIcon && "pl-10",
            (hasRightIcon || hasPasswordToggle || hasClearButton) && "pr-10",
            // State styling
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-green-500 focus-visible:ring-green-500",
            isFocused && "shadow-sm",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          ref={ref}
          {...props}
        />

        {/* Right Side Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Success/Error Icon */}
          {success && !error && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {error && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}

          {/* Clear Button */}
          {hasClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          )}

          {/* Password Toggle */}
          {hasPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Right Icon */}
          {hasRightIcon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-xs text-destructive mt-1 animate-slideUp">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition'> {
  onSearch?: (value: string) => void;
  searchDelay?: number;
}

export function SearchInput({ onSearch, searchDelay = 300, ...props }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = React.useState(props.value || '');

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchTerm as string);
    }, searchDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, searchDelay]);

  return (
    <Input
      {...props}
      icon={<Search className="w-4 h-4" />}
      iconPosition="left"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      clearable
      onClear={() => setSearchTerm('')}
    />
  );
}