import SwiftUI
import AVKit

struct FeedCell: View {
    let post: Post
    @State private var isUpvoted: Bool = false
    @State private var isDownvoted: Bool = false
    @State private var voteCount: Int = 27 // Assuming 27 as initial vote count
    
    var body: some View {
        ZStack {
            VStack {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 37) {
                        VStack(alignment: .leading){
                            Text("james.harden")
                                .fontWeight(.semibold)
                            Text("step back 3s everytime you reach")
                        }
                        HStack {
                            Text("10 min")
                                .foregroundColor(.gray)
                                .bold()
                                .font(.caption)
                            Text("📍1 mile")
                                .foregroundColor(.gray)
                                .bold()
                                .font(.caption)
                            Spacer()
                            
                            
                            NavigationLink(destination: CommentView()) {
                                Image(systemName: "bubble.right")
                                    .resizable()
                                    .frame(width: 20, height: 20)
                                    .foregroundStyle(.gray)
                            }
                            
                            Text("3 comments")
                                .foregroundColor(.gray)
                                .bold()
                                .font(.caption)
                            
                            Spacer()
                        }
                    }
                    .padding(10)
                    .foregroundStyle(.black)
                    .font(.subheadline)
                    
                    VStack {
                        Button {
                            if isUpvoted {
                                isUpvoted = false
                                voteCount -= 1
                            } else {
                                if isDownvoted {
                                    isDownvoted = false
                                    voteCount += 1
                                }
                                isUpvoted = true
                                voteCount += 1
                            }
                        } label: {
                            Image(systemName: isUpvoted ? "arrowshape.up.fill" : "arrowshape.up")
                                .resizable()
                                .frame(width: 28, height: 28)
                                .foregroundStyle(.black)
                        }
                        
                        Text("\(voteCount)")
                            .font(.caption)
                            .foregroundStyle(.black)
                            .bold()
                        
                        Button {
                            if isDownvoted {
                                isDownvoted = false
                                voteCount += 1
                            } else {
                                if isUpvoted {
                                    isUpvoted = false
                                    voteCount -= 1
                                }
                                isDownvoted = true
                                voteCount -= 1
                            }
                        } label: {
                            Image(systemName: isDownvoted ? "arrowshape.down.fill" : "arrowshape.down")
                                .resizable()
                                .frame(width: 28, height: 28)
                                .foregroundStyle(.black)
                        }
                    }
                    .padding()
                }
            }
            .overlay(
                GeometryReader { geometry in
                    Path { path in
                        path.move(to: CGPoint(x: 0, y: 0))
                        path.addLine(to: CGPoint(x: geometry.size.width, y: 0)) // Line at the top
                    }
                    .stroke(Color.gray.opacity(0.5), lineWidth: 1) // Line color and width
                }
            )
        }
    }
}

#Preview {
    FeedCell(post: Post(id: NSUUID().uuidString, videoUrl: ""))
}
