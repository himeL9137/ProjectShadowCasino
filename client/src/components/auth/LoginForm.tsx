import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useLoading } from "@/hooks/use-loading";
import { useEffect, useState } from "react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  savePassword: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const { showLoading } = useLoading();
  const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      savePassword: false,
    },
  });

  // Check for auto-login on component mount
  useEffect(() => {
    checkAutoLogin();
  }, []);

  async function checkAutoLogin() {
    try {
      const response = await fetch('/api/check-auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.autoLogin && result.user) {
        console.log("Auto-login successful for user:", result.user.username);
        showLoading(2000);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
        return;
      }
    } catch (error) {
      console.error("Auto-login check failed:", error);
    } finally {
      setIsCheckingAutoLogin(false);
    }
  }

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data);
      // Show loading screen for 4 seconds after successful login
      showLoading(4000);
      // Call onSuccess after a delay to allow loading screen to display
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 4000);
    } catch (error) {
      // Don't show loading screen if login fails
      console.error("Login error:", error);
    }
  }

  if (isCheckingAutoLogin) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-white text-sm">Checking for saved login...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full flex flex-col items-center">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-white block mb-1 text-left">Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your username"
                  className="w-full p-2 bg-[#333] border-none rounded text-white focus:bg-[#444] transition-colors"
                  style={{ background: '#333' }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-white block mb-1 text-left">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full p-2 bg-[#333] border-none rounded text-white focus:bg-[#444] transition-colors"
                  style={{ background: '#333' }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="savePassword"
          render={({ field }) => (
            <FormItem className="w-full flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-white data-[state=checked]:bg-[#6b48ff] data-[state=checked]:border-[#6b48ff]"
                />
              </FormControl>
              <FormLabel className="text-white text-sm cursor-pointer">
                Save password for this device
              </FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full p-3 bg-[#6b48ff] hover:bg-[#8a6aff] border-none rounded text-white text-base cursor-pointer transition-all hover:scale-105"
          style={{ background: '#6b48ff' }}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}