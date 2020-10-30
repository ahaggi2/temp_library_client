import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

import { _CardDetails } from '../../0-shared-components/card/shared-card.component'
import { _PaginatedCardsPayload } from '../../0-shared-components/shared-paginated-cards/shared-paginated-cards.component'
import { loadImageFromStorage, ImgCategory } from '../../util/util'


@Component({
  selector: 'app-author',
  templateUrl: './author.component.html',
  styleUrls: ['./author.component.css']
})
export class AuthorComponent implements OnInit {
  author: _Author = {} as _Author
  booksCards: _PaginatedCardsPayload<_CardDetails> = {} as _PaginatedCardsPayload<_CardDetails>;

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
  ) { }


  ngOnInit(): void {
    this.getAuthor()
  }



  getAuthor(): void {
    const id: string = this.route.snapshot.paramMap.get('id');
    this.apollo.watchQuery<_Author>({
      variables: { id: id },
      query: getAuthorQry,

    })
      .valueChanges
      .pipe(
        // delay(3000),
      takeUntil(this._ngUnsubscribe$),
        map((res: any) => {
          console.log(res)
          return res.data.author
        }),
        catchError((err, c) => {
          console.log(err)
          console.log(c)
          return of({}) // TODO
        }),

      ).subscribe((author) => {
        console.log(author)

        this.author.id = author?.id
        this.author.name = author?.name
        this.author.email = author?.email
        this.author.about = author?.about
        this.author.imgUri = loadImageFromStorage(author?.imgUri, ImgCategory.PERSON)


        this.author.books = author?.booksToAuthors?.map((bta) => {
          //_CardDetails  {header:{title:"wer" ,avatar:"" , subtitle:"" } , content:"content" , actionButtons:[]}
          let cardDetails: _CardDetails = {};
          cardDetails.header = { title: bta.book.title, subtitle: "sadf sadf", img: loadImageFromStorage(bta.book.imgUri, ImgCategory.BOOK), title_routerLink: `/book/${bta.book.id}` };
          cardDetails.content = bta.book.description
          return cardDetails;
        })



        

        //------------------------------------------------------------------------------------------------------------------------
        // this will be used inside the "SharedPaginatedCardsComponent" which wraps list of cards with a pagination and filtering features.
        // The list of cards in this case are an instance of the component "SharedCardComponent"
        this.booksCards = {
          cards: this.author.books,
          filterPredicate: (readerCard, filter: string): boolean => {
            return readerCard.header.title.toLowerCase().includes(filter.toLowerCase());
          }
        }


        //------------------------------------------------------------------------------------------------------------------------
      })
  }


  private _ngUnsubscribe$: Subject<void> = new Subject<void>();
  ngOnDestroy(): void {
    this._ngUnsubscribe$.next();
    this._ngUnsubscribe$.complete();
  }

}

type _Author = {
  id: string;
  name: string;
  email: string;
  about: string;
  books: any[];
  imgUri: string;
}


const getAuthorQry = gql
  `
  query getAuthorQry($id:String!) {
    author: getAuthorByID(id: $id) {
      id
      name
      email
      about
      imgUri
      booksToAuthors {
        id
        book {
          id
          title
          pages
          chapters
          price
          description
          imgUri
          booksToReaders {
            reader {
              name
            }
          }
        }
      }
    }
  }
  
`
  ;

