import { Body, Button, Container, Head, Html, Img, Preview, Section, Text, Row, Column, Font } from "@react-email/components";

interface WelcomeEmailProps {
  touristName: string;
  digitalIdUrl: string;
  tripStartDate: string;
  tripEndDate: string;
  destination: string;
}

export function WelcomeEmail({ touristName, digitalIdUrl, tripStartDate, tripEndDate, destination }: WelcomeEmailProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Welcome to Tourist Safety System - Your Digital ID is Ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://your-domain.com/logo.png" alt="Tourist Safety" style={logo} />
            <Text style={headerTitle}>Tourist Safety System</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {touristName},</Text>
            
            <Text style={paragraph}>
              Welcome to the Tourist Safety System! We're delighted to have you visit India. Your registration has been successfully completed, and your Digital Tourist ID is now ready.
            </Text>

            <Text style={paragraph}>
              Your Digital ID provides you with:
            </Text>

            <Section style={featureList}>
              <Row>
                <Column align="center">
                  <div style={featureIcon}>1</div>
                </Column>
                <Column>
                  <Text style={featureTitle}>Official Identification</Text>
                  <Text style={featureDescription}>Government-recognized digital ID for tourists</Text>
                </Column>
              </Row>
              <Row>
                <Column align="center">
                  <div style={featureIcon}>2</div>
                </Column>
                <Column>
                  <Text style={featureTitle}>Emergency Support</Text>
                  <Text style={featureDescription}>24/7 emergency assistance and tracking</Text>
                </Column>
              </Row>
              <Row>
                <Column align="center">
                  <div style={featureIcon}>3</div>
                </Column>
                <Column>
                  <Text style={featureTitle}>Real-time Alerts</Text>
                  <Text style={featureDescription}>Instant notifications for safety concerns</Text>
                </Column>
              </Row>
            </Section>

            <Section style={tripDetails}>
              <Text style={sectionTitle}>Your Trip Details</Text>
              <Row>
                <Column>
                  <Text style={detailLabel}>Destination:</Text>
                  <Text style={detailValue}>{destination}</Text>
                </Column>
                <Column>
                  <Text style={detailLabel}>Trip Period:</Text>
                  <Text style={detailValue}>{new Date(tripStartDate).toLocaleDateString()} - {new Date(tripEndDate).toLocaleDateString()}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={ctaSection}>
              <Button href={digitalIdUrl} style={primaryButton}>
                View Your Digital ID
              </Button>
            </Section>

            <Text style={paragraph}>
              Keep your Digital ID accessible at all times. Authorities can verify its authenticity by scanning the QR code or visiting the verification link.
            </Text>

            <Section style={securityNote}>
              <Text style={securityTitle}>Security Notice</Text>
              <Text style={securityText}>
                Your Digital ID uses blockchain-like cryptographic hashing to ensure authenticity and prevent tampering. Never share your ID with unauthorized individuals.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              For emergency assistance, call: 100 (Police) | 108 (Ambulance) | 101 (Fire)
            </Text>
            <Text style={footerText}>
              Tourist Safety Helpline: 1800-XXX-XXXX (24/7)
            </Text>
            <Text style={copyright}>
              © 2024 Tourist Safety System. Government of India. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f8fafc",
  fontFamily: "Inter, Arial, sans-serif",
  lineHeight: "1.6",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const header = {
  backgroundColor: "#1e40af",
  padding: "40px 30px",
  textAlign: "center" as const,
};

const logo = {
  width: "60px",
  height: "60px",
  marginBottom: "16px",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
};

const content = {
  padding: "40px 30px",
};

const greeting = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  color: "#4b5563",
  marginBottom: "20px",
  lineHeight: "1.6",
};

const featureList = {
  marginBottom: "30px",
};

const featureIcon = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  marginBottom: "8px",
};

const featureTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "4px",
};

const featureDescription = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const tripDetails = {
  backgroundColor: "#f3f4f6",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const detailLabel = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "4px",
};

const detailValue = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1f2937",
  marginBottom: "16px",
};

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const primaryButton = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "16px",
  display: "inline-block",
};

const securityNote = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "30px",
};

const securityTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#92400e",
  marginBottom: "8px",
};

const securityText = {
  fontSize: "14px",
  color: "#78350f",
  margin: "0",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "30px",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "8px",
};

const copyright = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "16px 0 0 0",
};

// Body component removed - using Html wrapper instead
