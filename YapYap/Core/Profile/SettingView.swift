import SwiftUI

struct SettingView: View {
    @State private var isNotificationsEnabled: Bool = true
    @State private var isPrivateAccount: Bool = false
    @State private var username: String = "Harry"
    @State private var email: String = "harry@example.com"
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Account")) {
                    HStack {
                        Text("Username")
                        Spacer()
                        Text(username)
                            .foregroundColor(.gray)
                    }
                    
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(email)
                            .foregroundColor(.gray)
                    }
                    
                    NavigationLink(destination: EditProfileView()) {
                        Text("Edit Profile")
                    }
                }
                
                Section(header: Text("Notifications")) {
                    Toggle(isOn: $isNotificationsEnabled) {
                        Text("Enable Notifications")
                    }
                }
                
                Section(header: Text("Privacy")) {
                    Toggle(isOn: $isPrivateAccount) {
                        Text("Private Account")
                    }
                }
                
                Section(header: Text("General")) {
                    NavigationLink(destination: AboutView()) {
                        Text("About")
                    }
                    NavigationLink(destination: HelpView()) {
                        Text("Help")
                    }
                    Button(action: {
                        // Handle log out action
                        print("User logged out")
                    }) {
                        Text("Log Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}


struct AboutView: View {
    var body: some View {
        VStack {
            Text("YapYap")
                .font(.largeTitle)
                .padding()
            
            Text("Version 1.0")
                .font(.subheadline)
                .padding()
            
            Spacer()
        }
        .navigationTitle("About")
    }
}

struct HelpView: View {
    var body: some View {
        VStack {
            Text("Help & Support")
                .font(.largeTitle)
                .padding()
            
            Text("For support, contact us at support@yapyap.com")
                .font(.subheadline)
                .padding()
            
            Spacer()
        }
        .navigationTitle("Help")
    }
}

#Preview {
    SettingView()
}
