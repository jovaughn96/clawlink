import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";

type Props = { children: React.ReactNode };

export function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) setError(signUpError.message);
    }
    setLoading(false);
  }

  if (session) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sign in to NicheBooker</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title={loading ? "Loading..." : "Sign in / Sign up"} onPress={signIn} disabled={loading} />
      <Text style={styles.hint}>First login creates your account. Then workspace bootstrap runs automatically.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#f3f4f6" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  input: { backgroundColor: "white", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  error: { color: "#b91c1c" },
  hint: { color: "#6b7280", marginTop: 6 },
});
