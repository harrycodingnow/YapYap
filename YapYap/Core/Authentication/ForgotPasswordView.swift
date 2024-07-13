////
////  ForgotPasswordView.swift
////  YapYap
////
////  Created by harryhou on 7/5/24.
////
//
import SwiftUI
struct ForgotPasswordView: View {
    @State private var email: String = ""
    @State private var showingAlert = false
    @State private var alertTitle: String = ""
    @State private var alertMessage: String = ""
    
    var body: some View {
        VStack {
            Text("Forgot Password")
                .font(.largeTitle)
                .padding(.bottom, 40)
            
            TextField("Enter your email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.bottom, 20)
                .autocapitalization(.none)
                .disableAutocorrection(true)
            
            Button(action: {
                if validateEmail(email: email) {
                    // Mock action for sending reset email
                    print("Reset password link sent to \(email)")
                    alertTitle = "Reset Email Sent"
                    alertMessage = "A password reset link has been sent to \(email)"
                } else {
                    alertTitle = "Invalid Email Format"
                    alertMessage = "Please enter a valid email address."
                }
                showingAlert = true
            }) {
                Text("Submit")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(width: 220, height: 60)
                    .background(Color.green)
                    .cornerRadius(15.0)
            }
            .alert(isPresented: $showingAlert) {
                Alert(title: Text(alertTitle), message: Text(alertMessage), dismissButton: .default(Text("OK")))
            }
            
            Spacer()
        }
        .padding()
    }
    
    func validateEmail(email: String) -> Bool {
        // Basic email validation
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Z]{2,64}"
        let emailPred = NSPredicate(format:"SELF MATCHES %@", emailRegEx)
        return emailPred.evaluate(with: email)
    }
}


#Preview {
    ForgotPasswordView()
}
