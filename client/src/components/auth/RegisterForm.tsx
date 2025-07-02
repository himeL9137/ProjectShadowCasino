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
import { Loader2 } from "lucide-react";
import { useLoading } from "@/hooks/use-loading";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(6, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const { showLoading } = useLoading();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    try {
      await register(data);
      // Show loading screen for 4 seconds after successful registration
      showLoading(4000);
      // Call onSuccess after a delay to allow loading screen to display
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 4000);
    } catch (error) {
      // Don't show loading screen if registration fails
      console.error("Registration error:", error);
    }
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
                  placeholder="Choose a username"
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
          name="email"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-white block mb-1 text-left">Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
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
          name="phone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-white block mb-1 text-left">Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
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
                  placeholder="Create a password"
                  className="w-full p-2 bg-[#333] border-none rounded text-white focus:bg-[#444] transition-colors"
                  style={{ background: '#333' }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}
