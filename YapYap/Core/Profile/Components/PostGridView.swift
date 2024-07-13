//
//  PostGridView.swift
//  YapYap
//
//  Created by harryhou on 6/5/24.
//

import SwiftUI

struct PostGridView: View {
    @StateObject var viewModel = FeedViewModel()
    private let items = [
        GridItem(.flexible(), spacing: 1),
        GridItem(.flexible(), spacing: 1),
        GridItem(.flexible(), spacing: 1)
    ]
    private let width = (UIScreen.main.bounds.width/3) - 2
    
    var body: some View {
        
        LazyVStack(spacing: 2) {
            ForEach(viewModel.posts) { post in
                FeedCell(post: post)
                    
                
            }
        }
    }
}

#Preview {
    PostGridView()
}
