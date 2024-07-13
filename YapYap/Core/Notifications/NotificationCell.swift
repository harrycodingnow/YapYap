//
//  NotificationCell.swift
//  YapYap
//
//  Created by harryhou on 6/4/24.
//

import SwiftUI

struct NotificationCell: View {
    var body: some View {
        HStack{
            Image(systemName: "person.circle.fill")
                .resizable()
                .frame(width: 32, height: 32)
                .foregroundStyle(Color(.systemGray5))
                           
            HStack {
                Text("max.verstappen")
                    .font(.footnote)
                    .fontWeight(.semibold) +
                
                Text(" liked one of your posts. adshjflasdfjdsjf;ads")
                    .font(.footnote) +
                
                Text(" 3d")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .fontWeight(.semibold)
            }
            
            Spacer()
            
            Rectangle()
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 6))

        }
        
        .padding(.horizontal)
    }
}

#Preview {
    NotificationCell()
}
