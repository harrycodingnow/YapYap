import SwiftUI

struct CommentView: View {
    @StateObject var viewModel = FeedViewModel()
    
    var body: some View {
        NavigationView { // Embed in NavigationView
            VStack {
                if let post = viewModel.posts.first {
                    FeedCell(post: post)
                        .id(post.id)
                    Divider()
                    
                    
                    CommentSection()
                    
                }
            }
           
        }
        .navigationTitle("💬 Comments") // Set navigation title here
    }
}

struct CommentSection: View {
    @State private var newComment: String = ""
    @State private var comments: [String] = [] // Example comments
    
    var body: some View {
        VStack(alignment: .leading) {
            
            ScrollView {
                VStack(alignment: .leading) {
                    ForEach(comments, id: \.self) { comment in
                        
                        HStack(spacing: 5){
                            Text("Jayson Tatum ")
                                .fontWeight(.semibold)
                            
                            Text("1 min")
                                .foregroundColor(.gray)
                                .bold()
                                .font(.caption)
                        }
                        Text(comment)
                        
                    }
                }
                .foregroundStyle(.black)
                .font(.subheadline)
            }
            
            Divider()
            
            HStack {
                TextField("Add a comment", text: $newComment)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: {
                    comments.append(newComment)
                    newComment = ""
                }) {
                    Text("Post")
                }
            }
            .padding(.top, 8)
        }
        .padding(10)
    }
}

#Preview {
    CommentView()
}
