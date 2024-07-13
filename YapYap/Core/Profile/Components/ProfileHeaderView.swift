//
//  ProfileHeaderView.swift
//  YapYap
//
//  Created by harryhou on 6/5/24.
//

import SwiftUI

struct ProfileHeaderView: View {
    var body: some View {
        NavigationStack{
            VStack (spacing: 16) {
                VStack(spacing: 8){
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width :80, height: 80)
                        .foregroundStyle(Color(.systemGray5))
                    
                    Text("@harry.hou")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                }
                
                // stats view
                HStack(spacing: 16){
                    UserStatView(value: 5, title: "Yaps")
                    UserStatView(value: 1, title: "Comments")
                    UserStatView(value: 7, title: "Votes")
                    
                }
                
                HStack {
                    NavigationLink(destination: EditProfileView()) {
                        
                        Text("Edit Profile")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .frame(width: 180, height: 32)
                            .foregroundStyle(.black)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                        
                    }

                    NavigationLink(destination: SettingView()) {
                        
                        Text("Setting")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .frame(width: 180, height: 32)
                            .foregroundStyle(.black)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                        
                    }
                }
                Divider()
            }
        }
    }
}

#Preview {
    ProfileHeaderView()
}

