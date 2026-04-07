import { Body, Button, Container, Head, Html, Preview, Section, Text, Row, Column, Font } from "@react-email/components";

interface GeoFenceAlertEmailProps {
  touristName: string;
  emergencyContactName: string;
  alertTime: string;
  currentLocation: string;
  safeZone: string;
  trackingLink: string;
  touristPhone: string;
}

export function GeoFenceAlertEmail({ 
  touristName, 
  emergencyContactName, 
  alertTime, 
  currentLocation, 
  safeZone,
  trackingLink,
  touristPhone 
}: GeoFenceAlertEmailProps) {
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
      <Preview>Zone Breach Alert for {touristName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={alertIcon}>!</div>
            <Text style={headerTitle}>ZONE BREACH ALERT</Text>
            <Text style={headerSubtitle}>Tourist Safety System</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {emergencyContactName},</Text>
            
            <Section style={alertBox}>
              <Text style={alertTitle}>GEO-FENCE BREACH DETECTED</Text>
              <Text style={alertDescription}>
                {touristName} has moved outside the designated safe zone area.
              </Text>
            </Section>

            <Section style={detailsSection}>
              <Text style={sectionTitle}>Breach Details</Text>
              
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
                  <Text style={detailLabel}>Current Location:</Text>
                  <Text style={detailValue}>{currentLocation}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Safe Zone:</Text>
                  <Text style={detailValue}>{safeZone}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Status:</Text>
                  <Text style={statusWarning}>OUTSIDE SAFE ZONE</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Contact:</Text>
                  <Text style={detailValue}>{touristPhone}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Text style={actionTitle}>RECOMMENDED ACTIONS</Text>
              
              <Section style={actionList}>
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>1</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Contact Tourist:</strong> Reach out to {touristName} to check their safety status
                    </Text>
                  </Column>
                </Row>
                
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>2</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Track Location:</strong> Monitor their current position using the tracking link
                    </Text>
                  </Column>
                </Row>
                
                <Row style={actionItem}>
                  <Column style={actionIconColumn}>
                    <div style={actionNumber}>3</div>
                  </Column>
                  <Column>
                    <Text style={actionText}>
                      <strong>Assess Situation:</strong> Determine if this is an emergency or planned movement
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={ctaSection}>
                <Button href={trackingLink} style={primaryButton}>
                  TRACK LOCATION
                </Button>
              </Section>
            </Section>

            <Section style={infoNote}>
              <Text style={infoTitle}>About Geo-Fence Alerts</Text>
              <Text style={infoText}>
                Geo-fence alerts are triggered when a tourist moves outside their designated safe area. This may be normal travel or could indicate a potential safety concern. Please assess the situation and contact the tourist if needed.
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
  backgroundColor: "#fffbeb",
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
  border: "2px solid #f59e0b",
};

const header = {
  backgroundColor: "#f59e0b",
  padding: "40px 30px",
  textAlign: "center" as const,
};

const alertIcon = {
  backgroundColor: "#ffffff",
  color: "#f59e0b",
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
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#fef3c7",
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
  backgroundColor: "#f59e0b",
  color: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "30px",
  textAlign: "center" as const,
};

const alertTitle = {
  fontSize: "18px",
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

const statusWarning = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#92400e",
  backgroundColor: "#fef3c7",
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
  backgroundColor: "#f59e0b",
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
  backgroundColor: "#f59e0b",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "16px",
  display: "inline-block",
};

const infoNote = {
  backgroundColor: "#dbeafe",
  border: "1px solid #3b82f6",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "30px",
};

const infoTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e40af",
  marginBottom: "8px",
};

const infoText = {
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
