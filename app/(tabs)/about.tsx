import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";

export default function About() {
  const router = useRouter();

  const pillars = [
    ["shield-check", "Verified Listings", "Properties are reviewed to reduce fake and misleading listings."],
    ["calendar-check", "Secure Appointments", "Customers and listers meet through traceable appointment records."],
    ["wallet", "Escrow Protection", "Commitment deposits help protect serious property transactions."],
    ["robot-outline", "Anti-Scam Intelligence", "Smart checks help detect duplicates, suspicious activity and risk."],
  ];

  const services = [
    "Property Rentals",
    "House Sales",
    "Land Sales",
    "Property Listing",
    "Appointment Management",
    "Escrow Services",
    "Property Verification",
    "Digital Property Management",
  ];

  return (
    <ScreenWrapper>
        <Navbar/>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="home-city" size={18} color="#2563eb" />
          <Text style={styles.badgeText}>Smart Real Estate Trust Platform</Text>
        </View>

        <Text style={styles.heroTitle}>OHLAM</Text>
        <Text style={styles.heroSubtitle}>
          Smart Property. Trusted Transactions. Real Results.
        </Text>

        <Text style={styles.heroText}>
          Finding, renting, buying, and managing property in Nigeria should not be a gamble.
          OHLAM is built to reduce fraud, verify listings, protect appointments, and make
          real estate transactions safer.
        </Text>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/home")}>
            <Text style={styles.primaryBtnText}>Explore Properties</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/dashboard/upload-property")}>
            <Text style={styles.secondaryBtnText}>List Property</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          ["Verified", "Listings"],
          ["Protected", "Appointments"],
          ["Smart", "Escrow"],
        ].map(([top, bottom]) => (
          <View key={top} style={styles.statCard}>
            <Text style={styles.statTop}>{top}</Text>
            <Text style={styles.statBottom}>{bottom}</Text>
          </View>
        ))}
      </View>

      <Section title="Why OHLAM Exists">
        <Text style={styles.paragraph}>
          Nigeria’s real estate market is full of opportunity, but also affected by fake
          agents, duplicate listings, forged documents, unavailable properties, appointment
          scams and advance payment fraud.
        </Text>

        <Text style={styles.paragraph}>
          OHLAM was created to solve these problems with technology, verification,
          appointment accountability, escrow protection and intelligent fraud detection.
        </Text>
      </Section>

      <View style={styles.quoteCard}>
        <MaterialCommunityIcons name="format-quote-open" size={30} color="#2563eb" />
        <Text style={styles.quote}>
          Every feature on OHLAM is designed around one question: How do we make this
          property transaction safer?
        </Text>
      </View>

      <Section title="What Makes Us Different">
        <View style={styles.pillarGrid}>
          {pillars.map(([icon, title, text]) => (
            <View key={title} style={styles.pillarCard}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={icon as any} size={24} color="#2563eb" />
              </View>
              <Text style={styles.pillarTitle}>{title}</Text>
              <Text style={styles.pillarText}>{text}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Our Core Services">
        <View style={styles.serviceGrid}>
          {services.map((service) => (
            <View key={service} style={styles.servicePill}>
              <MaterialCommunityIcons name="check-circle" size={17} color="#16a34a" />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Our Mission">
        <Text style={styles.paragraph}>
          To become Africa’s most trusted smart real estate platform by reducing fraud,
          improving transparency, and making property transactions safer, faster and more
          accessible.
        </Text>
      </Section>

      <Section title="Our Vision">
        <Text style={styles.paragraph}>
          To build the largest trusted digital property ecosystem in Africa where every
          property, document, appointment and transaction can be verified with confidence.
        </Text>
      </Section>

      <View style={styles.finalCard}>
        <Text style={styles.finalTitle}>We are not building another property website.</Text>
        <Text style={styles.finalText}>
          We are building the trust infrastructure that powers the future of real estate in
          Nigeria and Africa.
        </Text>
      </View>
    </ScreenWrapper>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  hero: {
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 18,
  },
  badgeText: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroSubtitle: {
    color: "#bfdbfe",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    lineHeight: 26,
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: -28,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    elevation: 3,
  },
  statTop: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 15,
  },
  statBottom: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
    marginBottom: 10,
    fontWeight: "500",
  },
  quoteCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  quote: {
    color: "#1e3a8a",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: 8,
  },
  pillarGrid: {
    gap: 12,
  },
  pillarCard: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  pillarTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
  },
  pillarText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  serviceText: {
    color: "#166534",
    fontWeight: "800",
    fontSize: 13,
  },
  finalCard: {
    marginHorizontal: 18,
    marginBottom: 40,
    padding: 24,
    borderRadius: 26,
    backgroundColor: "#2563eb",
  },
  finalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  finalText: {
    color: "#dbeafe",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    fontWeight: "600",
  },
});