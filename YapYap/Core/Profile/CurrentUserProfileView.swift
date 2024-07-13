//
//  CurrentUserProfileView.swift
//  YapYap
//
//  Created by harryhou on 6/5/24.
//

import SwiftUI

struct CurrentUserProfileView: View {
    var body: some View {
        NavigationStack{
            ScrollView {
                VStack(spacing: 2) {
                    ProfileHeaderView()
                    PostGridView()
                    
                    
                }
                .padding(.top)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    CurrentUserProfileView()
}
