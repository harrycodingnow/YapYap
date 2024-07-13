//
//  SwiftUIView.swift
//  YapYap
//
//  Created by harryhou on 7/5/24.
//

import SwiftUI

struct EditProfileView: View {
    @State private var username: String = ""
    @State private var bio: String = ""
    
    var body: some View {
        Form {
            Section(header: Text("User Info")) {
                TextField("Username", text: $username)
                TextField("Bio", text: $bio)
            }
            
            Button(action: {
                // Handle save action
                print("Profile updated")
            }) {
                Text("Save")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.green)
                    .cornerRadius(10)
            }
            .padding(.top)
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    EditProfileView()
}
