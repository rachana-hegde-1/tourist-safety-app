import { Button, Container, Head, Html, Img, Preview, Section, Text, Row, Column, Font } from "@react-email/components";

interface PanicAlertEmailProps {
  touristName: string;
  emergencyContactName: string;
  alertTime: string;
  location: string;
  trackingLink: string;
  touristPhone: string;
}

export function PanicAlertEmail({ 
  touristName, 
  emergencyContactName, 
  alertTime, 
  location, 
  trackingLink,
  touristPhone 
}: PanicAlertEmailProps) {
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
      <Preview>URGENT: Emergency Alert for {touristName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={alertIcon}>!</div>
            <Text style={headerTitle}>EMERGENCY ALERT</Text>
            <Text style={headerSubtitle}>Tourist Safety System</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {emergencyContactName},</Text>
            
            <Section style={alertBox}>
              <Text style={alertTitle}>URGENT: PANIC ALERT ACTIVATED</Text>
              <Text style={alertDescription}>
                {touristName} has triggered an emergency alert and needs immediate assistance.
              </Text>
            </Section>

            <Section style={detailsSection}>
              <Text style={sectionTitle}>Emergency Details</Text>
              
              <Row style={detailRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Tourist:</Text>
                  <Text style={detailValue}>{touristName}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Time:</Text>
                  <Text style={detailValue}>{new Date(alertTime).toLocaleString()}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Location:</Text>
                  <Text style={detailValue}>{location}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Contact:</Text>
                  <Text style={detailValue}>{touristPhone}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Status:</Text>
                  <Text style={statusActive}>ACTIVE EMERGENCY</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Response:</Text>
                  <Text style={detailValue}>Emergency services notified</Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Text style={actionTitle}>IMMEDIATE ACTIONS REQUIRED</Text>
              
              <Section style={actionList}>
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>1</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Track Location:</strong> Click the button below to track {touristName}'s real-time location
                    </Text>
                  </Column>
                </Row>
                
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>2</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Contact Authorities:</strong> Call emergency services if you haven't already
                    </Text>
                  </Column>
                </Row>
                
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>3</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Stay Available:</strong> Keep your phone available for coordination
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={ctaSection}>
                <Button href={trackingLink} style={primaryButton}>
                  TRACK LIVE LOCATION
                </Button>
              </Section>
            </Section>

            <Section style={emergencyNumbers}>
              <Text style={sectionTitle}>Emergency Numbers</Text>
              <Row>
                <Column>
                  <Text style={emergencyNumber}>
                    <strong>Police:</strong> 100
                  </Text>
                </Column>
                <Column>
                  <Text style={emergencyNumber}>
                    <strong>Ambulance:</strong> 108
                  </Text>
                </Column>
                <Column>
                  <Text style={emergencyNumber}>
                    <strong>Fire:</strong> 101
                  </Text>
                </Column>
              </Row>
              <Text style={helplineNumber}>
                <strong>Tourist Safety Helpline:</strong> 1800-XXX-XXXX (24/7)
              </Text>
            </Section>

            <Section style={importantNote}>
              <Text style={importantTitle}>IMPORTANT</Text>
              <Text style={importantText}>
                This is an automated emergency alert. The tourist safety system has automatically notified local authorities. Please cooperate fully with emergency responders.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This alert was generated by the Tourist Safety System at {new Date(alertTime).toLocaleString()}
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
  backgroundColor: "#fef2f2",
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
  border: "2px solid #dc2626",
};

const header = {
  backgroundColor: "#dc2626",
  padding: "40px 30px",
  textAlign: "center" as const,
};

const alertIcon = {
  backgroundColor: "#ffffff",
  color: "#dc2626",
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 auto 16px auto",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#fca5a5",
  fontSize: "16px",
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

const alertBox = {
  backgroundColor: "#dc2626",
  color: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "30px",
  textAlign: "center" as const,
};

const alertTitle = {
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 12px 0",
};

const alertDescription = {
  fontSize: "16px",
  margin: "0",
  lineHeight: "1.5",
};

const detailsSection = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const detailRow = {
  marginBottom: "16px",
};

const detailColumn = {
  flex: "1",
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
};

const statusActive = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "4px 8px",
  borderRadius: "4px",
  display: "inline-block",
};

const actionSection = {
  marginBottom: "30px",
};

const actionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const actionList = {
  marginBottom: "30px",
};

const actionItem = {
  marginBottom: "16px",
  alignItems: "flex-start",
};

const actionIconColumn = {
  width: "40px",
  paddingRight: "16px",
};

const actionNumber = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  fontSize: "14px",
};

const actionText = {
  fontSize: "15px",
  color: "#4b5563",
  margin: "0",
  lineHeight: "1.5",
};

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const primaryButton = {
  backgroundColor: "#dc2626",
  color: "#ffffff",
  padding: "16px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "16px",
  display: "inline-block",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const emergencyNumbers = {
  backgroundColor: "#f3f4f6",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "30px",
};

const emergencyNumber = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1f2937",
  marginBottom: "8px",
};

const helplineNumber = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1f2937",
  marginTop: "12px",
};

const importantNote = {
  backgroundColor: "#dbeafe",
  border: "1px solid #3b82f6",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "30px",
};

const importantTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e40af",
  marginBottom: "8px",
};

const importantText = {
  fontSize: "14px",
  color: "#1e40af",
  margin: "0",
  lineHeight: "1.5",
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
