import { Container, Head, Html, Preview, Section, Text, Row, Column, Font } from "@react-email/components";

interface DailySafetySummaryEmailProps {
  touristName: string;
  date: string;
  activeAlerts: Array<{
    type: string;
    time: string;
    location: string;
    status: string;
  }>;
  totalLocations: number;
  lastLocation: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
  }>;
}

export function DailySafetySummaryEmail({ 
  touristName, 
  date, 
  activeAlerts, 
  totalLocations, 
  lastLocation,
  emergencyContacts 
}: DailySafetySummaryEmailProps) {
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
      <Preview>Daily Safety Summary - {new Date(date).toLocaleDateString()}</Preview>
      <div style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>Daily Safety Summary</Text>
            <Text style={headerSubtitle}>Tourist Safety System</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {touristName},</Text>
            
            <Text style={paragraph}>
              Here's your daily safety summary for {new Date(date).toLocaleDateString()}. We're committed to keeping you safe during your visit to India.
            </Text>

            <Section style={summarySection}>
              <Text style={sectionTitle}>Today's Overview</Text>
              
              <Row style={summaryRow}>
                <Column style={summaryColumn}>
                  <div style={summaryBox}>
                    <Text style={summaryNumber}>{totalLocations}</Text>
                    <Text style={summaryLabel}>Location Updates</Text>
                  </div>
                </Column>
                <Column style={summaryColumn}>
                  <div style={summaryBox}>
                    <Text style={summaryNumber}>{activeAlerts.length}</Text>
                    <Text style={summaryLabel}>Active Alerts</Text>
                  </div>
                </Column>
                <Column style={summaryColumn}>
                  <div style={summaryBox}>
                    <Text style={summaryNumber}>{emergencyContacts.length}</Text>
                    <Text style={summaryLabel}>Emergency Contacts</Text>
                  </div>
                </Column>
              </Row>
            </Section>

            {activeAlerts.length > 0 && (
              <Section style={alertsSection}>
                <Text style={sectionTitle}>Active Alerts</Text>
                {activeAlerts.map((alert, index) => (
                  <Section key={index} style={alertItem}>
                    <Row>
                      <Column style={alertIconColumn}>
                        <div style={alertIcon}>{alert.type.charAt(0).toUpperCase()}</div>
                      </Column>
                      <Column>
                        <Text style={alertType}>{alert.type.toUpperCase()}</Text>
                        <Text style={alertTime}>{new Date(alert.time).toLocaleString()}</Text>
                        <Text style={alertLocation}>Location: {alert.location}</Text>
                        <Text style={alertStatus}>Status: {alert.status}</Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Section>
            )}

            <Section style={locationSection}>
              <Text style={sectionTitle}>Location Activity</Text>
              <Text style={locationLabel}>Last Known Location:</Text>
              <Text style={locationValue}>{lastLocation}</Text>
              <Text style={locationNote}>
                Your location tracking helps us provide better emergency response when needed.
              </Text>
            </Section>

            <Section style={contactsSection}>
              <Text style={sectionTitle}>Emergency Contacts</Text>
              <Row>
                {emergencyContacts.map((contact, index) => (
                  <Column key={index} style={contactColumn}>
                    <div style={contactCard}>
                      <Text style={contactName}>{contact.name}</Text>
                      <Text style={contactPhone}>{contact.phone}</Text>
                    </div>
                  </Column>
                ))}
              </Row>
            </Section>

            <Section style={tipsSection}>
              <Text style={sectionTitle}>Safety Tips</Text>
              <Section style={tipsList}>
                <Row style={tipItem}>
                  <Column style={tipIconColumn}>
                    <div style={tipIcon}>1</div>
                  </Column>
                  <Column>
                    <Text style={tipText}>
                      Keep your phone charged and location services enabled for better tracking
                    </Text>
                  </Column>
                </Row>
                <Row style={tipItem}>
                  <Column style={tipIconColumn}>
                    <div style={tipIcon}>2</div>
                  </Column>
                  <Column>
                    <Text style={tipText}>
                      Share your itinerary with trusted contacts before traveling
                    </Text>
                  </Column>
                </Row>
                <Row style={tipItem}>
                  <Column style={tipIconColumn}>
                    <div style={tipIcon}>3</div>
                  </Column>
                  <Column>
                    <Text style={tipText}>
                      Use the panic button feature in emergencies for immediate assistance
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Section style={emergencyInfo}>
              <Text style={sectionTitle}>Emergency Information</Text>
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
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This summary was generated automatically. You can manage your notification preferences in your account settings.
            </Text>
            <Text style={copyright}>
              © 2024 Tourist Safety System. Government of India. All rights reserved.
            </Text>
          </Section>
        </Container>
      </div>
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
  backgroundColor: "#3b82f6",
  padding: "40px 30px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#dbeafe",
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

const paragraph = {
  fontSize: "16px",
  color: "#4b5563",
  marginBottom: "20px",
  lineHeight: "1.6",
};

const summarySection = {
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const summaryRow = {
  marginBottom: "20px",
};

const summaryColumn = {
  flex: "1",
  padding: "0 8px",
};

const summaryBox = {
  backgroundColor: "#f3f4f6",
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const summaryNumber = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#3b82f6",
  margin: "0 0 8px 0",
};

const summaryLabel = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const alertsSection = {
  backgroundColor: "#fef2f2",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "30px",
};

const alertItem = {
  marginBottom: "16px",
};

const alertIconColumn = {
  width: "40px",
  paddingRight: "16px",
};

const alertIcon = {
  backgroundColor: "#dc2626",
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

const alertType = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#dc2626",
  margin: "0 0 4px 0",
};

const alertTime = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 4px 0",
};

const alertLocation = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0 0 4px 0",
};

const alertStatus = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#059669",
  margin: "0",
};

const locationSection = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #22c55e",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "30px",
};

const locationLabel = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "4px",
};

const locationValue = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1f2937",
  marginBottom: "8px",
};

const locationNote = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const contactsSection = {
  marginBottom: "30px",
};

const contactColumn = {
  flex: "1",
  padding: "0 8px",
};

const contactCard = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const contactName = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1f2937",
  margin: "0 0 4px 0",
};

const contactPhone = {
  fontSize: "14px",
  color: "#3b82f6",
  margin: "0",
};

const tipsSection = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "30px",
};

const tipsList = {
  marginBottom: "0",
};

const tipItem = {
  marginBottom: "16px",
  alignItems: "flex-start",
};

const tipIconColumn = {
  width: "40px",
  paddingRight: "16px",
};

const tipIcon = {
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

const tipText = {
  fontSize: "15px",
  color: "#4b5563",
  margin: "0",
  lineHeight: "1.5",
};

const emergencyInfo = {
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
