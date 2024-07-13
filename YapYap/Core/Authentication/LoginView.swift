import SwiftUI

struct LoginView: View {
    @State private var username: String = ""
    @State private var password: String = ""
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Login")
                    .font(.largeTitle)
                    .padding(.bottom, 40)
                
                TextField("Username", text: $username)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.bottom, 20)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.bottom, 40)
                
                Button(action: {
                    // Handle login action
                    print("Login button pressed")
                }) {
                    Text("Login")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(width: 220, height: 60)
                        .background(Color.green)
                        .cornerRadius(15.0)
                }
                
                NavigationLink(destination: ForgotPasswordView()) {
                    Text("Forgot Password?")
                        .foregroundColor(.green)
                        .padding(.top, 20)
                }
                
                NavigationLink(destination: SignUpView()) {
                    Text("Sign Up")
                        .foregroundColor(.green)
                        .padding(.top, 20)
                }
            }
            .padding()
        }
    }
}




#Preview {
    LoginView()
}
